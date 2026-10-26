export const prerender = false;

import type { APIRoute } from "astro";
import OpenAI from "openai";
import agentInstructions from "../../content/agent-instructions.md?raw";
import agentData from "../../content/agent-data.md?raw";

const SYSTEM_PROMPT = `${agentInstructions}

---
${agentData}
---

Respond ONLY with valid JSON — no prose, no markdown, no text outside the JSON object.

Response format (always return all fields):
{
  "text": "3–5 sentence answer displayed in the response card. First person singular. Only cite figures that answer the question.",
  "highlight_card": "metric",
  "updates": {
    "metric": { "value": "$2.4M", "label": "Operational cost reduction via AI automation", "sub": "Across D365 + Manhattan DFIO · 3 deployments at Kohl & Frisch" },
    "alert_items": [
      { "icon": "⚡", "text": "Demand spike detected: SKU-7842 +340%", "meta": "Azure OpenAI · illustrative · auto-routed to procurement" },
      { "icon": "✓", "text": "BOL-93241 classified & matched to PO", "meta": "GPT-4o · illustrative · 0.24s processing" }
    ],
    "ai_prompt": "The user's question verbatim",
    "ai_response": "Same as the text field"
  }
}

Rules for highlight_card — pick exactly one:
- "metric"     → cost, ROI, savings, financial impact, business value. The metric label must describe the figure honestly: 99.7% is a pick-accuracy LEVEL, 13% is a forecast-accuracy IMPROVEMENT, 30% is an operating-cost REDUCTION
- "alert"      → real-time AI, monitoring, automation pipelines, agents acting on signals
- "experience" → years of experience, career history, background, leadership
- "skills"     → specific technologies, tools, platforms
- "ai"         → AI/agent projects, research, or anything else

Tailor the updates to the question. alert_items are illustrative examples of the kind of signal the systems raise, never claims about live data. Never say "Fortune 500"; name Kohl & Frisch. The site describes seven distribution centres (Delta, Calgary, Regina, Winnipeg, Toronto, Montreal, Moncton).`;

/** Health: lets the client show LIVE / OFFLINE honestly without spending a completion. */
export const GET: APIRoute = async () => {
  const configured = !!(import.meta.env.OPENAI_API_KEY ?? import.meta.env.OPENCODE_API_KEY);
  return new Response(JSON.stringify({ ok: configured }), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
};

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

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const completion = await client.chat.completions.create({
          model: import.meta.env.OPENCODE_MODEL ?? "gpt-4o",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt.trim() },
          ],
          stream: true,
          response_format: { type: "json_object" },
          max_tokens: 700,
          temperature: 0.4,
        });

        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (delta) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`)
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Stream failed";
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
