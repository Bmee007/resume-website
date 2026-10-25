// src/scripts/motion/ambient.js — synthesised ambient "wind through fog". No audio asset.
// Off by default (autoplay policy + courtesy). Remembers the choice for the session.
let ctx = null, master = null, nodes = null;

function build() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
  // brown noise buffer
  const seconds = 4, rate = ctx.sampleRate, buf = ctx.createBuffer(1, rate * seconds, rate), d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.Q.value = 0.7;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 180; bp.Q.value = 1.2;
  // slow breathing LFO on the band-pass centre and on gain
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
  const lfoGain = ctx.createGain(); lfoGain.gain.value = 120; lfo.connect(lfoGain); lfoGain.connect(bp.frequency);
  const lfo2 = ctx.createOscillator(); lfo2.frequency.value = 0.045;
  const swell = ctx.createGain(); swell.gain.value = 0.6; const lfo2Gain = ctx.createGain(); lfo2Gain.gain.value = 0.25; lfo2.connect(lfo2Gain); lfo2Gain.connect(swell.gain);
  src.connect(lp); lp.connect(bp); bp.connect(swell); swell.connect(master);
  src.start(); lfo.start(); lfo2.start();
  nodes = { src, lfo, lfo2 };
}

let applyRef = null;
/** Called by the entry gate (a user gesture), so audio can start immediately. */
export function setAmbient(on) { if (applyRef) applyRef(on); }

export function initAmbient() {
  const btn = document.getElementById('audio-toggle');
  if (!btn) return;
  let on = false;
  try { on = sessionStorage.getItem('bk-audio') === '1'; } catch { /* ignore */ }
  const apply = async (next) => {
    on = next;
    btn.setAttribute('aria-pressed', String(on));
    try { sessionStorage.setItem('bk-audio', on ? '1' : '0'); } catch { /* ignore */ }
    if (on) {
      if (!ctx) build();
      if (ctx.state === 'suspended') await ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 2.5);
    } else if (ctx) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
    }
  };
  applyRef = apply;
  btn.addEventListener('click', () => apply(!on));
  if (on) btn.setAttribute('aria-pressed', 'true');
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (on) ctx.resume(); });
}
