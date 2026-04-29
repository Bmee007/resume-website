export const prerender = false;
export const maxDuration = 10;

import type { APIRoute } from "astro";

interface ChartData {
  type: "bar" | "line" | "doughnut";
  title: string;
  labels: string[];
  values: number[];
  unit: string;
}

const BG      = "#0d0d0a";
const GRID    = "#1e1e18";
const TEXT    = "#e8e0cc";
const MUTED   = "#6a6050";
const AMBER   = "#d49820";
const PALETTE = ["#d49820", "#5b8fd9", "#4caf88", "#e07030", "#9b8fd9", "#e07080"];

function esc(s: string | number) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmt(v: number, unit: string) {
  const abs = Math.abs(v);
  const n = abs >= 1_000_000
    ? `${(v / 1_000_000).toFixed(1)}M`
    : abs >= 1_000
    ? `${(v / 1_000).toFixed(0)}K`
    : v % 1 === 0 ? String(v) : v.toFixed(1);
  return unit ? `${n}${unit}` : n;
}

function clip(s: string, max = 13) {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// ── Bar chart ────────────────────────────────────────────────────────────────
function barSVG({ title, labels, values, unit }: ChartData) {
  const W = 800, H = 460;
  const pad = { t: 70, r: 32, b: 68, l: 68 };
  const cW = W - pad.l - pad.r;
  const cH = H - pad.t - pad.b;
  const max = Math.max(...values) * 1.18;
  const n = values.length;
  const gap = Math.max(6, 20 - n * 2);
  const bW = (cW - gap * (n - 1)) / n;

  const grid = [0, 0.25, 0.5, 0.75, 1].map(p => {
    const y = (pad.t + cH * (1 - p)).toFixed(1);
    return `<line x1="${pad.l}" y1="${y}" x2="${W - pad.r}" y2="${y}" stroke="${GRID}" stroke-width="1"/>
<text x="${pad.l - 8}" y="${(+y + 4).toFixed(1)}" text-anchor="end" fill="${MUTED}" font-size="10">${fmt(max * p, unit)}</text>`;
  }).join("\n");

  const bars = values.map((v, i) => {
    const h = Math.max(3, (v / max) * cH);
    const x = (pad.l + i * (bW + gap)).toFixed(1);
    const y = (pad.t + cH - h).toFixed(1);
    const cx = (pad.l + i * (bW + gap) + bW / 2).toFixed(1);
    return `<rect x="${x}" y="${y}" width="${bW.toFixed(1)}" height="${h.toFixed(1)}" fill="${AMBER}" opacity="0.9" rx="3"/>
<text x="${cx}" y="${(+y - 7).toFixed(1)}" text-anchor="middle" fill="${TEXT}" font-size="11" font-weight="600">${esc(fmt(v, unit))}</text>
<text x="${cx}" y="${(pad.t + cH + 18).toFixed(1)}" text-anchor="middle" fill="${MUTED}" font-size="10">${esc(clip(labels[i]))}</text>`;
  }).join("\n");

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">
<rect width="${W}" height="${H}" fill="${BG}"/>
<text x="${W / 2}" y="40" text-anchor="middle" fill="${AMBER}" font-size="14" font-weight="600">${esc(title)}</text>
<line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${pad.t + cH}" stroke="${GRID}" stroke-width="1"/>
${grid}
${bars}
</svg>`;
}

// ── Line chart ───────────────────────────────────────────────────────────────
function lineSVG({ title, labels, values, unit }: ChartData) {
  const W = 800, H = 460;
  const pad = { t: 70, r: 40, b: 68, l: 68 };
  const cW = W - pad.l - pad.r;
  const cH = H - pad.t - pad.b;
  const min = Math.min(0, ...values);
  const max = Math.max(...values) * 1.15;
  const range = max - min;
  const n = values.length;

  const pts = values.map((v, i) => ({
    x: pad.l + (i / (n - 1)) * cW,
    y: pad.t + cH - ((v - min) / range) * cH,
  }));

  const grid = [0, 0.25, 0.5, 0.75, 1].map(p => {
    const y = (pad.t + cH * (1 - p)).toFixed(1);
    return `<line x1="${pad.l}" y1="${y}" x2="${W - pad.r}" y2="${y}" stroke="${GRID}" stroke-width="1"/>
<text x="${pad.l - 8}" y="${(+y + 4).toFixed(1)}" text-anchor="end" fill="${MUTED}" font-size="10">${fmt(min + range * p, unit)}</text>`;
  }).join("\n");

  const area = `M ${pts[0].x.toFixed(1)} ${(pad.t + cH).toFixed(1)} ` +
    pts.map(p => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") +
    ` L ${pts[n - 1].x.toFixed(1)} ${(pad.t + cH).toFixed(1)} Z`;

  const line = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  const dots = pts.map((p, i) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5" fill="${AMBER}" stroke="${BG}" stroke-width="2"/>
<text x="${p.x.toFixed(1)}" y="${(p.y - 12).toFixed(1)}" text-anchor="middle" fill="${TEXT}" font-size="11" font-weight="600">${esc(fmt(values[i], unit))}</text>
<text x="${p.x.toFixed(1)}" y="${(pad.t + cH + 18).toFixed(1)}" text-anchor="middle" fill="${MUTED}" font-size="10">${esc(clip(labels[i]))}</text>`).join("\n");

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">
<defs>
  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${AMBER}" stop-opacity="0.2"/>
    <stop offset="100%" stop-color="${AMBER}" stop-opacity="0.02"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="${BG}"/>
<text x="${W / 2}" y="40" text-anchor="middle" fill="${AMBER}" font-size="14" font-weight="600">${esc(title)}</text>
${grid}
<path d="${area}" fill="url(#ag)"/>
<polyline points="${line}" fill="none" stroke="${AMBER}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
${dots}
</svg>`;
}

// ── Doughnut chart ───────────────────────────────────────────────────────────
function doughnutSVG({ title, labels, values }: ChartData) {
  const W = 800, H = 460;
  const cx = 300, cy = H / 2, R = 160, r = 88;
  const total = values.reduce((a, b) => a + b, 0);
  let start = -Math.PI / 2;

  const slices = values.map((v, i) => {
    const angle = (v / total) * 2 * Math.PI;
    const end = start + angle;
    const large = angle > Math.PI ? 1 : 0;
    const color = PALETTE[i % PALETTE.length];
    const x1o = cx + R * Math.cos(start), y1o = cy + R * Math.sin(start);
    const x2o = cx + R * Math.cos(end),   y2o = cy + R * Math.sin(end);
    const x1i = cx + r * Math.cos(end),   y1i = cy + r * Math.sin(end);
    const x2i = cx + r * Math.cos(start), y2i = cy + r * Math.sin(start);
    const d = `M ${x1o.toFixed(1)} ${y1o.toFixed(1)} A ${R} ${R} 0 ${large} 1 ${x2o.toFixed(1)} ${y2o.toFixed(1)} L ${x1i.toFixed(1)} ${y1i.toFixed(1)} A ${r} ${r} 0 ${large} 0 ${x2i.toFixed(1)} ${y2i.toFixed(1)} Z`;
    const pct = ((v / total) * 100).toFixed(1);
    start = end;
    return { d, color, pct, label: labels[i] };
  });

  const paths = slices.map(s => `<path d="${s.d}" fill="${s.color}" opacity="0.9" stroke="${BG}" stroke-width="2"/>`).join("\n");

  const lx = 500;
  const legend = slices.map((s, i) => {
    const ly = 150 + i * 34;
    return `<rect x="${lx}" y="${ly - 10}" width="13" height="13" fill="${s.color}" rx="2"/>
<text x="${lx + 21}" y="${ly + 2}" fill="${TEXT}" font-size="12">${esc(clip(s.label, 18))}</text>
<text x="${W - 28}" y="${ly + 2}" text-anchor="end" fill="${MUTED}" font-size="12">${s.pct}%</text>`;
  }).join("\n");

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">
<rect width="${W}" height="${H}" fill="${BG}"/>
<text x="${W / 2}" y="40" text-anchor="middle" fill="${AMBER}" font-size="14" font-weight="600">${esc(title)}</text>
${paths}
${legend}
</svg>`;
}

function generateSVG(data: ChartData): string {
  if (data.type === "line")     return lineSVG(data);
  if (data.type === "doughnut") return doughnutSVG(data);
  return barSVG(data);
}

// ── Route ─────────────────────────────────────────────────────────────────────
export const POST: APIRoute = async ({ request }) => {
  let chartData: ChartData | undefined;

  try {
    const body = await request.json();
    chartData = body?.chartData;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (
    !chartData ||
    !Array.isArray(chartData.labels) ||
    !Array.isArray(chartData.values) ||
    chartData.labels.length < 2 ||
    chartData.values.length < 2
  ) {
    return new Response(JSON.stringify({ error: "Valid chartData required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const svg = generateSVG(chartData);
  const b64 = Buffer.from(svg, "utf-8").toString("base64");
  const dataUrl = `data:image/svg+xml;base64,${b64}`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ url: dataUrl })}\n\n`));
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
};
