// src/scripts/ask.js — "Ask the system" live console (streams from /api/chat)
import { gsap, Flip, reduced } from './motion/core.js';

let initialized = false;

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const ROWS = { metric: 'card-metric-big', alert: 'card-alert', experience: 'card-yrs', skills: 'card-skills', ai: 'card-ai' };

function focusRow(key) {
  const rows = document.querySelectorAll('#ask-bento .readout-row');
  if (!rows.length || !ROWS[key]) return;
  const apply = () => {
    rows.forEach((r) => r.classList.remove('is-focus'));
    document.getElementById(ROWS[key])?.classList.add('is-focus');
  };
  if (reduced()) { apply(); return; }
  const state = Flip.getState(rows);
  apply();
  Flip.from(state, { duration: 0.7, ease: 'expo.out', nested: true });
}

function fadeSwap(el, apply) {
  if (!el) return;
  gsap.to(el, { opacity: 0, duration: 0.18, onComplete: () => { apply(); gsap.to(el, { opacity: 1, duration: 0.4 }); } });
}

function updateReadout(u) {
  if (!u) return;
  if (u.metric) {
    const { value, label, sub } = u.metric;
    if (value) fadeSwap(document.getElementById('metric-value'), () => { document.getElementById('metric-value').textContent = value; });
    if (label) fadeSwap(document.getElementById('metric-label'), () => { document.getElementById('metric-label').textContent = label; });
    if (sub) fadeSwap(document.getElementById('metric-sub'), () => { document.getElementById('metric-sub').textContent = sub; });
  }
  if (Array.isArray(u.alert_items)) {
    const list = document.getElementById('alert-list');
    fadeSwap(list, () => {
      list.innerHTML = u.alert_items.map((it, i) => `
        <div class="alert-item${i > 0 ? ' alert-item--ok' : ''}">
          <span class="alert-icon" aria-hidden="true">${escapeHtml(it.icon)}</span>
          <span class="alert-text">${escapeHtml(it.text)}</span>
          <span class="alert-meta">${escapeHtml(it.meta)}</span>
        </div>`).join('');
    });
  }
  if (u.ai_response) {
    fadeSwap(document.getElementById('ai-response-text'), () => { document.getElementById('ai-response-text').textContent = u.ai_response; });
  }
}

async function streamAnswer(prompt, abort) {
  const out = document.getElementById('ai-response-text');
  const dots = document.getElementById('ai-dots');
  const status = document.getElementById('ask-status');
  let shown = '';
  if (dots) dots.hidden = false;
  if (out) out.textContent = '';
  try {
    const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }), signal: abort.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let full = '', buf = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n'); buf = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') {
          if (dots) dots.hidden = true;
          try {
            const parsed = JSON.parse(full);
            if (parsed.highlight_card) focusRow(parsed.highlight_card);
            if (parsed.updates) updateReadout(parsed.updates);
            if (status) status.textContent = '';
            return { ok: true };
          } catch { return { ok: shown.length > 0 }; }
        }
        try {
          const { delta, error } = JSON.parse(raw);
          if (error) throw new Error(error);
          if (delta) {
            full += delta;
            const m = full.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)/); // partial match: stream as it arrives
            if (m) {
              const txt = m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
              if (txt !== shown && out) { shown = txt; out.textContent = txt; }
            }
          }
        } catch (e) { if (!(e instanceof SyntaxError)) throw e; }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') return { ok: false, aborted: true };
    if (dots) dots.hidden = true;
    if (status) status.textContent = 'SIGNAL LOST — TRY AGAIN';
    return { ok: false, error: err };
  }
  return { ok: shown.length > 0 };
}

// Canned answers (verified facts only) so the console never dead-ends when the model is offline.
const CANNED = {
  'How did you use Azure OpenAI in production?': { card: 'alert', text: 'Azure OpenAI runs inside Dynamics 365 procurement: it classifies inbound documents, matches them to purchase orders and routes approvals. Manual order-processing time fell 68% and the forecasting agents lifted accuracy 13%.' },
  'What is your Microsoft Dynamics 365 expertise?': { card: 'experience', text: 'I led the full IBM AS400 → Dynamics 365 migration for Kohl & Frisch, Canada\'s national pharmaceutical distributor: an 18-month program, a 45-person team, 30% lower operating cost, and no shipments stopped at cut-over.' },
  'Tell me about the $2.4M cost reduction you drove': { card: 'metric', text: '$2.4M of operational cost removed across three enterprise deployments: D365 procurement automation, DFIO pick-path optimisation, and a Copilot Studio assistant that now handles 90% of tier-1 IT queries for 2,400 staff.' },
  'What results have you driven at Kohl & Frisch?': { card: 'metric', text: 'Seven distribution centres on one ERP and WMS, 99.7% pick accuracy, +15% throughput, −5% labour cost per order, 16 processes automated end-to-end by agents, and $2.4M in operational savings.' },
};
let online = null;
let qaPromise = null;
/** Upstream Q&A (45 verified answers). Loaded only when needed so it stays out of the main bundle. */
function loadQa() {
  if (!qaPromise) qaPromise = import('../content/agent-qa.json').then((m) => (m.default || m).questions || []).catch(() => []);
  return qaPromise;
}
const STOP = new Set(['the', 'a', 'an', 'you', 'your', 'me', 'my', 'what', 'how', 'did', 'do', 'does', 'is', 'are', 'about', 'tell', 'with', 'for', 'and', 'or', 'of', 'in', 'on', 'to', 'at', 'have', 'has', 'can', 'describe', 'time', 'when']);
const tokens = (s) => s.toLowerCase().replace(/[^a-z0-9$% ]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
async function bestQa(prompt) {
  const qa = await loadQa();
  const q = new Set(tokens(prompt));
  let best = null, bestScore = 0;
  for (const item of qa) {
    const kws = (item.keywords || []).map((k) => k.toLowerCase());
    const qt = tokens(item.question || '');
    let score = 0;
    for (const w of q) { if (kws.includes(w)) score += 2; else if (qt.includes(w)) score += 1; }
    if (score > bestScore) { bestScore = score; best = item; }
  }
  return bestScore >= 2 ? best : null;
}
const CARD_FOR = { behavioral: 'experience', domain: 'experience', 'agent-engineering': 'ai', 'agent-security': 'ai', 'ai-engineering': 'ai', 'how-to-ai': 'ai', research: 'ai' };

async function checkHealth() {
  const el = document.getElementById('ask-health'); const txt = document.getElementById('ask-health-text');
  try {
    const r = await fetch('/api/chat', { method: 'GET', cache: 'no-store' });
    const j = r.ok ? await r.json() : { ok: false };
    online = !!j.ok;
  } catch { online = false; }
  if (el) el.dataset.state = online ? 'live' : 'offline';
  if (txt) txt.textContent = online ? 'Live · GPT-4o' : 'Offline · saved answers';
}

export function initAsk() {
  const root = document.getElementById('ask-bento');
  if (!root || initialized) return;
  initialized = true;
  checkHealth();

  const input = document.getElementById('ask-input');
  const send = document.getElementById('ask-send');
  const status = document.getElementById('ask-status');
  const promptEl = document.getElementById('ai-prompt-text');
  const dots = document.getElementById('ai-dots');
  let current = null;

  input?.addEventListener('input', () => { if (send) send.disabled = !input.value.trim(); });
  let touched = false;
  document.querySelectorAll('.ask-chip, .ask-more-btn').forEach((chip) => chip.addEventListener('click', () => {
    const p = chip.dataset.prompt; if (!p) return;
    touched = true; chip.classList.add('is-asked');
    if (input) input.value = p; if (send) send.disabled = false; ask(p);
  }));
  input?.addEventListener('focus', () => { touched = true; });
  send?.addEventListener('click', () => { const p = input?.value.trim(); if (p) ask(p); });
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { const p = input.value.trim(); if (p) { e.preventDefault(); ask(p); } }
  });

  // First time the console is mostly on screen and nobody has touched it: type one question and show its saved answer
  // (never the live model, so a page view costs nothing). Reduced motion: the answer just appears.
  const consoleEl = document.querySelector('#ask .console');
  if (consoleEl && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      setTimeout(() => { if (!touched) demo(); }, 1100);
    }, { threshold: 0.55 });
    io.observe(consoleEl);
  }
  async function demo() {
    const prompt = 'What results have you driven at Kohl & Frisch?'; const canned = CANNED[prompt]; if (!canned || !input) return;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reducedMotion) for (let i = 1; i <= prompt.length; i++) { if (touched) return; input.value = prompt.slice(0, i); await new Promise((r) => setTimeout(r, 22)); }
    if (touched) { return; }
    input.value = prompt; if (send) send.disabled = false;
    if (promptEl) fadeSwap(promptEl, () => { promptEl.textContent = prompt; });
    focusRow(canned.card);
    fadeSwap(document.getElementById('ai-response-text'), () => { document.getElementById('ai-response-text').textContent = canned.text; });
    if (status) status.textContent = 'SAMPLE ANSWER · ASK YOUR OWN ABOVE';
    document.querySelector('.ask-chip[data-prompt="' + prompt.replace(/"/g, '\\"') + '"]')?.classList.add('is-asked');
  }

  async function ask(prompt) {
    if (current) { current.abort(); current = null; }
    if (send) send.disabled = true;
    if (status) status.textContent = 'PROCESSING…';
    if (promptEl) fadeSwap(promptEl, () => { promptEl.textContent = prompt; });
    const canned = CANNED[prompt] || await bestQa(prompt).then((q) => (q ? { card: CARD_FOR[q.category] || 'ai', text: q.text } : null));
    if (online === false && canned) {
      if (status) status.textContent = '';
      focusRow(canned.card);
      fadeSwap(document.getElementById('ai-response-text'), () => { document.getElementById('ai-response-text').textContent = canned.text; });
      if (status) status.textContent = 'SAVED ANSWER · ILLUMI IS OFFLINE';
      if (send && input?.value.trim()) send.disabled = false;
      return;
    }
    if (online === false && !canned) {
      if (status) status.textContent = '';
      fadeSwap(document.getElementById('ai-response-text'), () => { document.getElementById('ai-response-text').textContent = 'Illumi is offline right now and has no saved answer for that one. Try a prompt above, or ask about agents, ERP, WMS, forecasting, security or leadership.'; });
      if (send && input?.value.trim()) send.disabled = false;
      return;
    }
    current = new AbortController();
    const r = await streamAnswer(prompt, current);
    current = null;
    if (!r?.ok && !r?.aborted) {
      const out = document.getElementById('ai-response-text');
      if (canned) { focusRow(canned.card); if (out) out.textContent = canned.text; if (status) status.textContent = 'LIVE MODEL UNAVAILABLE — SHOWING A SAVED ANSWER'; }
      else if (out) out.textContent = 'The live model is unreachable right now. Try one of the prompts above for a saved answer.';
    }
    if (send && input?.value.trim()) send.disabled = false;
    if (dots) dots.hidden = true;
    if (status && status.textContent === 'PROCESSING…') status.textContent = r?.ok ? '' : 'SIGNAL LOST — TRY AGAIN';
  }
}
