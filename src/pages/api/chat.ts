export const prerender = false;

import type { APIRoute } from "astro";
import OpenAI from "openai";

const SYSTEM_PROMPT = `You are an AI assistant embedded in Borina Keo's professional portfolio website. Answer questions in first person on her behalf. Be specific, confident, and metric-driven. Respond ONLY with valid JSON — no prose, no markdown, no text outside the JSON object.

Response format (always return all fields):
{
  "text": "2–4 sentence answer displayed in the response card. Always cite exact numbers when relevant.",
  "highlight_card": "metric",
  "updates": {
    "metric": { "value": "$2.4M", "label": "Operational cost reduction via AI automation", "sub": "Across D365 + Manhattan DFIO integrations over 3 enterprise deployments" },
    "alert_items": [
      { "icon": "⚡", "text": "Demand spike detected: SKU-7842 +340%", "meta": "Azure OpenAI · just now · auto-routed to procurement" },
      { "icon": "✓", "text": "BOL-93241 classified & matched to PO", "meta": "GPT-4o · 8s ago · 0.24s processing time" }
    ],
    "skills": [
      { "name": "Microsoft Dynamics 365", "pct": 98, "color": "amber" },
      { "name": "Azure OpenAI / AI Builder", "pct": 91, "color": "blue" },
      { "name": "Manhattan DFIO / WMS", "pct": 95, "color": "green" }
    ],
    "ai_prompt": "The user's question verbatim",
    "ai_response": "Same as the text field"
  }
}

Rules for highlight_card — pick exactly one:
- "metric"     → question about cost, ROI, savings, financial impact, business value
- "alert"      → question about real-time AI, monitoring, automation pipelines, alerts, live systems
- "experience" → question about years of experience, career history, background, leadership
- "skills"     → question about specific technologies, tools, platforms, certifications
- "ai"         → question about AI projects, Copilot, leadership achievements, or anything else

Always tailor the updates object to the question. The alert_items, metric, and skills should reflect the topic of the question — not always the default values.

Borina Keo's verified facts (never fabricate numbers):
• $2.4M operational cost reduction via AI automation
• 68% reduction in manual order processing time
• 15+ years enterprise systems leadership
• 90% of tier-1 IT queries handled by Copilot Studio chatbot
• 2,400 warehouse staff served by the Copilot deployment
• 3 Fortune 500 enterprise D365 + Manhattan DFIO deployments
• Pick accuracy improved to 99.7% via WMS AI integration
• Technologies: Microsoft Dynamics 365, Manhattan DFIO, Azure OpenAI, IBM AS400, Power Automate, AI Builder, Python/ML, Microsoft Copilot, GPT-4o, Claude, Google Gemini`;

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
