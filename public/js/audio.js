const key = 'farm-audio-v1';
let settings;
try { settings = JSON.parse(localStorage.getItem(key) || '{}'); } catch { settings = {}; }
let context, unlocked = false, lastCue = 0;
window.addEventListener('pointerdown', () => { unlocked = true; }, {once:true});
window.addEventListener('keydown', () => { unlocked = true; }, {once:true});
export const audioSettings = { muted: settings.muted ?? true, volume: settings.volume ?? 0.3 };
export function saveAudio() { localStorage.setItem(key, JSON.stringify(audioSettings)); }
export function cue(kind = 'ok') {
  if (!unlocked || audioSettings.muted || performance.now() - lastCue < 150) return;
  lastCue = performance.now();
  try {
    context ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator(), gain = context.createGain();
    const pitch={error:180,till:230,plant:390,water:610,harvest:740,buy:440,sell:680,accept_order:490,complete_order:720,stock_fish:370,feed_fish:510,harvest_fish:700,add_chicken:420,feed_chicken:510,collect_eggs:680,convert:560,start:450,claim:700,unlock:630,place_building:360,place_decoration:500,interact:470};
    oscillator.type = kind==='water'?'triangle':'sine'; oscillator.frequency.value = pitch[kind]||520;
    gain.gain.setValueAtTime(audioSettings.volume * 0.055, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
    oscillator.connect(gain).connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.12);
  } catch { /* Audio is optional; the visual confirmation remains available. */ }
}
