'use client';

import * as React from 'react';

type SoundKind =
  | 'forward'
  | 'back'
  | 'select'
  | 'toggle'
  | 'complete'
  | 'validate';

function playTone(
  audioContext: AudioContext,
  frequency: number,
  duration: number,
  gain = 0.04
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

function playSound(audioContext: AudioContext, kind: SoundKind): void {
  switch (kind) {
    case 'forward':
      playTone(audioContext, 440, 0.12, 0.035);
      window.setTimeout(() => playTone(audioContext, 554, 0.14, 0.03), 70);
      break;
    case 'back':
      playTone(audioContext, 392, 0.1, 0.03);
      break;
    case 'select':
      playTone(audioContext, 523, 0.08, 0.025);
      break;
    case 'toggle':
      playTone(audioContext, 330, 0.05, 0.028);
      window.setTimeout(() => playTone(audioContext, 247, 0.09, 0.022), 45);
      break;
    case 'complete':
      playTone(audioContext, 392, 0.12, 0.035);
      window.setTimeout(() => playTone(audioContext, 494, 0.12, 0.03), 90);
      window.setTimeout(() => playTone(audioContext, 587, 0.18, 0.028), 180);
      break;
    case 'validate':
      playTone(audioContext, 523, 0.08, 0.03);
      window.setTimeout(() => playTone(audioContext, 659, 0.14, 0.035), 70);
      window.setTimeout(() => playTone(audioContext, 784, 0.16, 0.03), 150);
      break;
  }
}

export function useOnboardingSound(): {
  play: (kind: SoundKind) => void;
} {
  const audioContextRef = React.useRef<AudioContext | null>(null);

  const getContext = React.useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') {
      return null;
    }

    if (!audioContextRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextClass) {
        return null;
      }
      audioContextRef.current = new AudioContextClass();
    }

    return audioContextRef.current;
  }, []);

  const play = React.useCallback(
    (kind: SoundKind): void => {
      const context = getContext();
      if (!context) {
        return;
      }

      if (context.state === 'suspended') {
        void context.resume();
      }

      playSound(context, kind);
    },
    [getContext]
  );

  return { play };
}
