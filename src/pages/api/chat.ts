export const prerender = false;
export const maxDuration = 30;

import type { APIRoute } from "astro";
import OpenAI from "openai";
import agentInstructions from "../../content/agent-instructions.md?raw";
import agentData from "../../content/agent-data.md?raw";
import qaData from "../../content/agent-qa.json";

// System prompt is composed from two editable markdown files:
//   src/content/agent-instructions.md  — tone, persona, behavioral rules
//   src/content/agent-data.md          — verified facts and metrics to draw from
const SYSTEM_PROMPT = `${agentInstructions}

---

${agentData}

---

Respond ONLY with valid JSON — no prose, no markdown, no text outside the JSON object.

Response format (always return all fields):
{
  "text": "2–4 sentence answer. Open with personality, close with a metric.",
  "highlights": ["keyword1", "$metric", "TechName"],
  "chart": {
    "type": "bar",
    "title": "Descriptive chart title",
    "labels": ["Label A", "Label B", "Label C"],
    "values": [100, 75, 50],
    "unit": "unit string"
  },
  "lidaSpec": {
    "data": [{"label": "Label A", "value": 100}, {"label": "Label B", "value": 75}],
    "goal": "Show a bar chart comparing enterprise AI deployment metrics",
    "chartType": "bar",
    "unit": "unit string"
  }
}

highlights: 3–6 keywords from the text to visually emphasize. Include exact metrics, technology names, company names, and key achievements. ALWAYS include at least 2 highlights — never return an empty array.

chart.type rules — pick exactly one:
- "bar"      → comparisons, before/after, multiple categories
- "line"     → trends over time, growth, progression
- "doughnut" → proportions, percentage breakdowns

ALWAYS return a valid chart with labels and values arrays containing at least 2 items. If the question has no obvious chart story, use this fallback:
{ "type": "bar", "title": "Key Impact Metrics", "labels": ["Cost Reduction", "Processing Time Saved", "Query Automation", "Pick Accuracy"], "values": [2400000, 68, 90, 99.7], "unit": "%" }

Never return an empty chart, null chart, or omit the chart field.

lidaSpec: mirrors chart data in {label, value} format for the LIDA infographic service.
- lidaSpec.data must be an array of {label, value} objects matching chart.labels/chart.values
- lidaSpec.goal is a clear natural language sentence describing what the chart visualizes
- lidaSpec.chartType matches chart.type
- lidaSpec.unit matches chart.unit
Never omit lidaSpec.`;

// ── Q&A lookup ────────────────────────────────────────────────────────────────
// Words too common to use as match signals
const STOP_WORDS = new Set([
  'a','an','the','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','can','to','of',
  'in','for','on','with','at','by','from','as','and','but','or','not','so','just',
  'i','me','my','we','our','you','your','he','she','it','they','them','its',
  'what','which','who','how','why','when','where','tell','give','describe',
  'explain','about','this','that','these','those','than','very','also','some',
  'more','most','other','into','out','over','up','time','way','use','used',
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w))
  );
}

function findBestMatch(prompt: string) {
  const promptTokens = tokenize(prompt);
  if (promptTokens.size === 0) return null;

  let bestEntry = null;
  let bestScore = 0;

  for (const qa of qaData.questions) {
    const keywords: string[] = qa.keywords ?? [];
    if (!keywords.length) continue;

    let matched = 0;
    for (const kw of keywords) {
      // A keyword matches if any of its tokens appear in the prompt
      const kwTokens = tokenize(kw);
      if ([...kwTokens].some(t => promptTokens.has(t))) matched++;
    }

    const score = matched / keywords.length;
    if (score > bestScore) {
      bestScore = score;
      bestEntry = qa;
    }
  }

  // Require at least 35% keyword overlap to use the pre-crafted answer
  return bestScore >= 0.35 ? bestEntry : null;
}

// ── Route ─────────────────────────────────────────────────────────────────────
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

  const encoder = new TextEncoder();

  // ── Pre-crafted Q&A lookup (no API call needed) ──
  const match = findBestMatch(prompt.trim());
  if (match) {
    const payload = JSON.stringify({
      text:       match.text,
      highlights: match.highlights,
      chart:      match.chart,
    });
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: payload })}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
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
  }

  // ── GPT-4o fallback for unrecognised questions ───
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
          max_tokens: 750,
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
