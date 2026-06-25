import type { TrainingProgressEvent } from '@/lib/training/training-progress';

type RunTrainingStreamOptions = {
  agentId: string;
  questionCount: number;
  onEvent: (event: TrainingProgressEvent) => void;
  signal?: AbortSignal;
};

export async function runTrainingStream({
  agentId,
  questionCount,
  onEvent,
  signal
}: RunTrainingStreamOptions): Promise<void> {
  const response = await fetch('/api/training/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId, questionCount }),
    signal
  });

  if (!response.ok) {
    let message = 'Training failed to start';
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) {
        message = payload.error;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (!response.body) {
    throw new Error('Training stream unavailable');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) {
        continue;
      }

      const payload = line.slice(6).trim();
      if (!payload || payload === '[DONE]') {
        continue;
      }

      onEvent(JSON.parse(payload) as TrainingProgressEvent);
    }
  }
}
