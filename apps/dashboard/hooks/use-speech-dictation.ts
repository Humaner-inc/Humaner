'use client';

import * as React from 'react';

type SpeechRecognitionAlternative = {
  transcript: string;
  confidence: number;
};

type SpeechRecognitionResult = {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
};

type SpeechRecognitionResultList = {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
};

type SpeechRecognitionEvent = Event & {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionErrorEvent = Event & {
  error: string;
  message: string;
};

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

const SILENCE_TIMEOUT_MS = 3000;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!window.isSecureContext) {
    return null;
  }

  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function mapSpeechError(error: string): string | null {
  switch (error) {
    case 'aborted':
    case 'no-speech':
      return null;
    case 'not-allowed':
      return 'Microphone access was denied.';
    case 'audio-capture':
      return 'No microphone was found.';
    case 'network':
      return 'Voice input needs an internet connection. Chrome or Edge work best.';
    case 'service-not-allowed':
      if (typeof window !== 'undefined' && window.self !== window.top) {
        return 'Voice input is unavailable in preview.';
      }
      return 'Your browser blocked voice input. Try Chrome or Edge.';
    case 'language-not-supported':
      return 'This language is not supported for voice input.';
    default:
      return 'Voice input is unavailable.';
  }
}

async function requestMicrophonePermission(): Promise<
  'granted' | 'denied' | 'unavailable'
> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return 'unavailable';
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    for (const track of stream.getTracks()) {
      track.stop();
    }
    return 'granted';
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === 'NotAllowedError' ||
        error.name === 'PermissionDeniedError')
    ) {
      return 'denied';
    }
    return 'unavailable';
  }
}

export type UseSpeechDictationOptions = {
  value: string;
  onChange: (value: string) => void;
  lang?: string;
  disabled?: boolean;
};

export type UseSpeechDictationReturn = {
  isSupported: boolean;
  isListening: boolean;
  error: string | null;
  toggle: () => void;
  stop: () => void;
};

export function useSpeechDictation({
  value,
  onChange,
  lang,
  disabled = false
}: UseSpeechDictationOptions): UseSpeechDictationReturn {
  const [isSupported, setIsSupported] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const recognitionRef = React.useRef<SpeechRecognitionInstance | null>(null);
  const listeningIntentRef = React.useRef(false);
  const silenceTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const stopRef = React.useRef<() => void>(() => {});
  const baseTextRef = React.useRef('');
  const valueRef = React.useRef(value);
  const onChangeRef = React.useRef(onChange);

  const clearSilenceTimeout = React.useCallback((): void => {
    if (silenceTimeoutRef.current !== null) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, []);

  const resetSilenceTimeout = React.useCallback((): void => {
    clearSilenceTimeout();
    silenceTimeoutRef.current = setTimeout(() => {
      silenceTimeoutRef.current = null;
      stopRef.current();
    }, SILENCE_TIMEOUT_MS);
  }, [clearSilenceTimeout]);

  React.useEffect(() => {
    valueRef.current = value;
  }, [value]);

  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  React.useEffect(() => {
    setIsSupported(getSpeechRecognition() !== null);
  }, []);

  const stop = React.useCallback(() => {
    clearSilenceTimeout();
    listeningIntentRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
  }, [clearSilenceTimeout]);

  React.useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  const start = React.useCallback(async () => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition || disabled) {
      return;
    }

    setError(null);
    listeningIntentRef.current = true;
    baseTextRef.current = valueRef.current;
    if (baseTextRef.current.length > 0 && !baseTextRef.current.endsWith(' ')) {
      baseTextRef.current += ' ';
    }

    const micPermission = await requestMicrophonePermission();
    if (!listeningIntentRef.current) {
      return;
    }

    if (micPermission === 'denied') {
      setError('Microphone access was denied.');
      listeningIntentRef.current = false;
      return;
    }

    if (micPermission === 'unavailable') {
      setError('No microphone was found.');
      listeningIntentRef.current = false;
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang =
      lang ?? (typeof navigator !== 'undefined' ? navigator.language : 'en-US');

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? '';
        if (result.isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }

      if (finalText) {
        baseTextRef.current += finalText;
      }

      if (interim.length > 0 || finalText.length > 0) {
        resetSilenceTimeout();
      }

      onChangeRef.current(baseTextRef.current + interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const message = mapSpeechError(event.error);
      if (message) {
        clearSilenceTimeout();
        setError(message);
        listeningIntentRef.current = false;
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (!listeningIntentRef.current) {
        setIsListening(false);
        return;
      }

      try {
        recognition.start();
      } catch {
        listeningIntentRef.current = false;
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
      resetSilenceTimeout();
    } catch {
      clearSilenceTimeout();
      setError('Could not start voice input.');
      listeningIntentRef.current = false;
      setIsListening(false);
    }
  }, [clearSilenceTimeout, disabled, lang, resetSilenceTimeout]);

  const toggle = React.useCallback(() => {
    if (isListening) {
      stop();
      return;
    }

    void start().catch(() => {
      clearSilenceTimeout();
      setError('Could not start voice input.');
      listeningIntentRef.current = false;
      setIsListening(false);
    });
  }, [clearSilenceTimeout, isListening, start, stop]);

  React.useEffect(() => {
    return () => {
      clearSilenceTimeout();
      listeningIntentRef.current = false;
      recognitionRef.current?.abort();
    };
  }, [clearSilenceTimeout]);

  return { isSupported, isListening, error, toggle, stop };
}
