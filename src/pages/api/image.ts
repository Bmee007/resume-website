export const prerender = false;
export const maxDuration = 60;

import type { APIRoute } from "astro";
import OpenAI from "openai";

interface LidaSpec {
  data: { label: string; value: number }[];
  goal: string;
  chartType?: string;
  unit?: string;
}

function sseStream(payload: Record<string, string>) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

export const POST: APIRoute = async ({ request }) => {
  let prompt: string;
  let lidaSpec: LidaSpec | undefined;

  try {
    const body = await request.json();
    prompt = body?.prompt;
    lidaSpec = body?.lidaSpec;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return new Response(JSON.stringify({ error: "Prompt is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (prompt.length > 500) {
    return new Response(JSON.stringify({ error: "Prompt too long" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Path A: LIDA microservice ────────────────────────────────────────────────
  const lidaUrl = import.meta.env.LIDA_SERVICE_URL;
  if (lidaSpec && lidaUrl) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const res = await fetch(`${lidaUrl}/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              data:       lidaSpec!.data,
              goal:       lidaSpec!.goal,
              chart_type: lidaSpec!.chartType ?? "bar",
              title:      lidaSpec!.goal,
              unit:       lidaSpec!.unit ?? "",
            }),
          });

          if (!res.ok) {
            const err = await res.text();
            throw new Error(`LIDA service error ${res.status}: ${err}`);
          }

          const { image } = await res.json() as { image: string };
          if (!image) throw new Error("LIDA returned no image");

          // Return as a data URI — img.src works identically with data URIs
          const dataUrl = `data:image/png;base64,${image}`;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ url: dataUrl })}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (err) {
          const message = err instanceof Error ? err.message : "LIDA generation failed";
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, { headers: SSE_HEADERS });
  }

  // ── Path B: DALL-E 3 → DALL-E 2 fallback ────────────────────────────────────
  const apiKey = import.meta.env.OPENAI_API_KEY ?? import.meta.env.OPENCODE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Always use OpenAI for image generation — DALL-E is not available on proxy servers
  const client = new OpenAI({ apiKey, baseURL: "https://api.openai.com/v1" });

  const dallePrompt = `Professional data visualization infographic for an enterprise AI consultant resume website. Topic: ${prompt.trim()}. Dark near-black background (#0a0a0a), amber gold (#d49820) and electric blue (#5b8fd9) geometric data elements, clean minimalist business design, subtle grid lines, abstract charts and flow diagrams suggesting enterprise scale, no readable text.`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let url: string | undefined;

        try {
          // Race DALL-E 3 against a 6s timeout so DALL-E 2 can still run within Vercel's budget
          const dalle3Timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("DALL-E 3 timeout")), 6000)
          );
          const response = await Promise.race([
            client.images.generate({
              model: "dall-e-3",
              prompt: dallePrompt,
              n: 1,
              size: "1024x1024",
              style: "natural",
              quality: "standard",
            }),
            dalle3Timeout,
          ]);
          url = (response as Awaited<ReturnType<typeof client.images.generate>>).data[0]?.url;
          if (!url) throw new Error("No image URL returned");
        } catch {
          // DALL-E 3 failed or timed out — fall back to DALL-E 2 (~3s, no style/quality params)
          const fallbackPrompt = dallePrompt.slice(0, 1000);
          const fallback = await client.images.generate({
            model: "dall-e-2",
            prompt: fallbackPrompt,
            n: 1,
            size: "1024x1024",
          });
          url = fallback.data[0]?.url;
          if (!url) throw new Error("No image URL returned from fallback");
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ url })}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Image generation failed";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
};
