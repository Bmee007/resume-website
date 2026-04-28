export const prerender = false;
export const maxDuration = 60; // DALL-E 3 takes 15-25s — requires Vercel Pro

import type { APIRoute } from "astro";
import OpenAI from "openai";

export const POST: APIRoute = async ({ request }) => {
  let prompt: string;
  try {
    const body = await request.json();
    prompt = body?.prompt;
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

  const apiKey = import.meta.env.OPENAI_API_KEY ?? import.meta.env.OPENCODE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = new OpenAI({
    apiKey,
    baseURL: import.meta.env.OPENCODE_SERVER_URL
      ? `${import.meta.env.OPENCODE_SERVER_URL}/v1`
      : "https://api.openai.com/v1",
  });

  const dallePrompt = `Professional data visualization infographic for an enterprise AI consultant resume website. Topic: ${prompt.trim()}. Dark near-black background (#0a0a0a), amber gold (#d49820) and electric blue (#5b8fd9) geometric data elements, clean minimalist business design, subtle grid lines, abstract charts and flow diagrams suggesting enterprise scale, no readable text.`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let url: string | undefined;

        try {
          const response = await client.images.generate({
            model: "dall-e-3",
            prompt: dallePrompt,
            n: 1,
            size: "1024x1024",
            style: "natural",
            quality: "standard",
          });
          url = response.data[0]?.url;
          if (!url) throw new Error("No image URL returned");
        } catch {
          // DALL-E 3 failed — retry with DALL-E 2 (faster, no style/quality params, 1000 char limit)
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
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
};
