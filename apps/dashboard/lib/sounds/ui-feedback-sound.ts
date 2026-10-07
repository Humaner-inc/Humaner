'use client';

export type UiFeedbackSound = 'mail-pin' | 'mail-delete';

function playTone(
  audioContext: AudioContext,
  frequency: number,
  duration: number,
  gain = 0.028
): void {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gainNode.gain.value = gain;

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  const now = audioContext.currentTime;
  gainNode.gain.setValueAtTime(gain, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

  oscillator.start(now);
  oscillator.stop(now + duration);
}

let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!sharedContext) {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return null;
    sharedContext = new AudioContextClass();
  }

  return sharedContext;
}

export function playUiFeedbackSound(kind: UiFeedbackSound): void {
  const context = getAudioContext();
  if (!context) return;

  if (context.state === 'suspended') {
    void context.resume();
  }

  if (kind === 'mail-pin') {
    playTone(context, 392, 0.09, 0.022);
    window.setTimeout(() => playTone(context, 523, 0.11, 0.02), 55);
    return;
  }

  playTone(context, 220, 0.07, 0.018);
  window.setTimeout(() => playTone(context, 165, 0.12, 0.016), 48);
}
