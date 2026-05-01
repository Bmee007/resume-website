export const prerender = false;
export const maxDuration = 60;

import type { APIRoute } from "astro";
import OpenAI from "openai";

// Skill-specific visual concepts for DALL-E prompts
const SKILL_CONCEPTS: Record<string, string> = {
  "Agent Harness Design":              "neural network harness architecture, interconnected AI agent nodes with orchestration control flows radiating outward",
  "Skills & Tool Integration":         "modular tool ecosystem, glowing API connectors as circuit bridges linking floating capability nodes",
  "Multi-Step Workflows":              "cascading workflow pipeline, sequential glowing process stages flowing in luminous waves",
  "LLM Memory Research":               "vast memory palace of crystalline data nodes, episodic and semantic memory streams converging into a central core",
  "Agent Security & Trust":            "fortress of layered digital security shields, trust boundary lattices and encryption barriers",
  "Prompt Injection Defense":          "cyber defense wall blocking injection streams, firewall grid deflecting adversarial code vectors",
  "Supply Chain AI":                   "global supply chain neural map, glowing logistics pathways and AI decision nodes spanning continents",
  "Healthcare ERP Integration":        "medical data integration network, precise healthcare system nodes connected by luminous data threads",
  "Retail WMS / TMS":                  "smart distribution center overhead view, precision warehouse automation with robotic pick systems",
  "ERP Systems (D365, AS400)":         "enterprise resource planning matrix, legacy and modern system layers bridged by flowing data conduits",
  "Warehouse Management (DFIO)":       "autonomous warehouse intelligence, aerial view of distribution center with robotic orchestration",
  "Demand Forecasting":                "predictive wave patterns, demand signal flows through time-series data ripples and forecasting horizons",
  "Python · ML / Statistical Modeling":"python neural network code visualization, statistical modeling equations floating in glowing data matrices",
  "Azure OpenAI · GPT-4o · Claude":    "cloud AI constellation, multiple large language models as radiant spheres orbiting in azure-lit space",
  "RAG & Vector Retrieval":            "vector space knowledge constellation, document embeddings as glowing stars in semantic space with retrieval beams",
  "LLM Evaluation & Monitoring":       "AI model quality telemetry dashboard, evaluation metrics flowing through neural monitoring streams",
  "Power Automate · AI Builder":       "automated business process flows, interconnected workflow nodes linking enterprise systems",
  "Data Pipeline Engineering":         "massive data pipeline infrastructure, torrential streams of structured data flowing through processing stages",
  "AI Program Leadership":             "strategic AI command constellation, program roadmap illuminated across a star-field of milestones",
  "Cross-Functional Team Building":    "interconnected team network graph, collaborative nodes forming a unified organizational web",
  "Stakeholder & C-Suite Alignment":   "executive vision pyramid, strategic alignment rays converging from leadership constellation above boardroom",
  "Change Management":                 "transformation wave rippling through organizational network, adoption flowing through connected systems",
  "Enterprise Architecture":           "enterprise technology blueprint, layered system architecture in precise geometric arrangement with glowing connections",
};

export const POST: APIRoute = async ({ request }) => {
  let skill: string;
  try {
    const body = await request.json();
    skill = body?.skill?.trim();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!skill) {
    return new Response(JSON.stringify({ error: "skill is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = import.meta.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const concept = SKILL_CONCEPTS[skill] ?? `${skill}, abstract AI technology visualization`;

  const prompt = `Dark cinematic digital art: ${concept}. Deep near-black background, dramatic amber and gold accent lighting, subtle glowing circuit patterns, futuristic tech aesthetic, moody professional atmosphere, high detail. No text, no labels, no words.`;

  try {
    const client = new OpenAI({ apiKey });
    const response = await client.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1792x1024",
      response_format: "b64_json",
      quality: "standard",
    });

    const b64 = response.data[0]?.b64_json;
    if (!b64) throw new Error("No image data returned");

    return new Response(
      JSON.stringify({ url: `data:image/png;base64,${b64}` }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Image generation failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
