let audioCtx = null;
let gainNode = null;
let timeoutId = null;

function getContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

export function playRingtone() {
  stopRingtone();
  const ctx = getContext();
  gainNode = ctx.createGain();
  gainNode.gain.value = 0.3;
  gainNode.connect(ctx.destination);

  function playTone(freq, start, duration) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(g);
    g.connect(gainNode);
    osc.start(start);
    osc.stop(start + duration);
  }

  function scheduleRing() {
    const now = ctx.currentTime;
    playTone(440, now, 0.4);
    playTone(480, now + 0.4, 0.4);
    playTone(440, now + 0.8, 0.4);
    playTone(480, now + 1.2, 0.4);
    timeoutId = setTimeout(scheduleRing, 1600);
  }

  if (ctx.state === "suspended") ctx.resume();
  scheduleRing();
}

export function stopRingtone() {
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  if (gainNode) {
    gainNode.disconnect();
    gainNode = null;
  }
}
