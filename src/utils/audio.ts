// Web Audio API Synthesizer for Taskmaster Sound Cues
// 100% offline, zero network requests, instant playback

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function isAudioContextSuspended(): boolean {
  if (typeof window === 'undefined') return false;
  return audioCtx ? audioCtx.state === 'suspended' : false;
}

export async function unlockAudioContext(): Promise<boolean> {
  const ctx = getAudioContext();
  if (!ctx) return false;
  try {
    if ((ctx.state as string) === 'suspended') {
      await ctx.resume();
    }
    return (ctx.state as string) === 'running';
  } catch {
    return false;
  }
}

export function playSealBreak() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Quick pop
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);
  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  
  // Rustle noise
  const bufferSize = ctx.sampleRate * 0.15;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1800;
  filter.Q.value = 3;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.2, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  osc.start(now);
  noise.start(now);
  osc.stop(now + 0.15);
  noise.stop(now + 0.15);
}

export function playCountdownTick() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, now);
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.05);
}

export function playBuzzer() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'sawtooth';
  osc2.type = 'sawtooth';
  osc1.frequency.setValueAtTime(140, now);
  osc2.frequency.setValueAtTime(146, now); // slightly detuned for harsh TV game show buzz

  gain.gain.setValueAtTime(0.35, now);
  gain.gain.setValueAtTime(0.35, now + 0.5);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.65);
  osc2.stop(now + 0.65);
}

export function playScoreReveal(pitchMultiplier: number = 1.0) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Delightful chiming chord
  const baseFreqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  baseFreqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq * pitchMultiplier, now + idx * 0.03);
    
    gain.gain.setValueAtTime(0.18, now + idx * 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.03 + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.03);
    osc.stop(now + idx * 0.03 + 0.55);
  });
}

export function playDQSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Sad trombone / dissonant slide
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.linearRampToValueAtTime(80, now + 0.5);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.6);
}

export function playFanfare() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Royal brass notes: C4, G4, C5, E5, G5
  const notes = [
    { freq: 261.63, start: 0.0, dur: 0.2 },
    { freq: 392.00, start: 0.2, dur: 0.2 },
    { freq: 523.25, start: 0.4, dur: 0.25 },
    { freq: 659.25, start: 0.65, dur: 0.25 },
    { freq: 783.99, start: 0.9, dur: 1.1 },
  ];

  notes.forEach(n => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(n.freq, now + n.start);

    // Filter to simulate brass warmth
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now + n.start);

    gain.gain.setValueAtTime(0, now + n.start);
    gain.gain.linearRampToValueAtTime(0.25, now + n.start + 0.03);
    gain.gain.setValueAtTime(0.25, now + n.start + n.dur - 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + n.start + n.dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + n.start);
    osc.stop(now + n.start + n.dur + 0.05);
  });
}
