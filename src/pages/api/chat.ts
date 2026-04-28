export const prerender = false;

import type { APIRoute } from "astro";
import OpenAI from "openai";

const SYSTEM_PROMPT = `You are an AI assistant embedded in Borina Keo's professional portfolio website. Answer questions in first person on her behalf. Be specific, confident, and metric-driven. Respond ONLY with valid JSON — no prose, no markdown, no text outside the JSON object.

Response format (always return all fields):
{
  "text": "2–4 sentence answer to display. Always cite exact numbers when relevant.",
  "highlights": ["keyword1", "$metric", "TechName"],
  "chart": {
    "type": "bar",
    "title": "Descriptive chart title",
    "labels": ["Label A", "Label B", "Label C"],
    "values": [100, 75, 50],
    "unit": "unit string"
  }
}

highlights: 3–6 keywords from the text to visually emphasize. Include exact metrics like "$2.4M", "68%", technology names, company names, and key achievements. ALWAYS include at least 2 highlights — never return an empty array.

chart.type rules — pick exactly one based on the data story:
- "bar"      → comparisons, before/after scenarios, multiple categories side by side
- "line"     → trends over time, growth progression, performance over years
- "doughnut" → proportions, percentage breakdowns, distribution of whole

ALWAYS return a valid chart object with labels and values arrays containing at least 2 items each. If the question does not naturally suggest a specific chart, fall back to this default bar chart showing Borina's core impact metrics:
{ "type": "bar", "title": "Key Impact Metrics", "labels": ["Cost Reduction", "Processing Time Saved", "Query Automation", "Pick Accuracy"], "values": [2400000, 68, 90, 99.7], "unit": "%" }

Never return an empty chart, null chart, or omit the chart field entirely.

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
          max_tokens: 600,
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
