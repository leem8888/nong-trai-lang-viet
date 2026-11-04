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
    oscillator.type = 'sine'; oscillator.frequency.value = kind === 'error' ? 180 : 520;
    gain.gain.setValueAtTime(audioSettings.volume * 0.055, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
    oscillator.connect(gain).connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.12);
  } catch { /* Audio is optional; the visual confirmation remains available. */ }
}
