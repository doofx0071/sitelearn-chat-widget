// ─────────────────────────────────────────────
//  SiteLearn Chat Widget — API Layer
// ─────────────────────────────────────────────

import type {
  Message,
  Citation,
  FeedbackRating,
  FeedbackPayload,
  HandoffPayload,
  StreamChunk,
} from './types';

// ─── Helpers ─────────────────────────────────

function uid(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function now(): string {
  return new Date().toISOString();
}

function buildHeaders(extra?: Record<string, string>, apiKey?: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-SiteLearn-Client': 'widget/1.0',
    ...(apiKey ? { 'x-api-key': apiKey } : {}),
    ...extra,
  };
}

// ─── Error normalisation ──────────────────────

export class ApiError extends Error {
  code: string;
  retryable: boolean;
  status?: number;

  constructor(message: string, code = 'UNKNOWN', retryable = false, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.retryable = retryable;
    this.status = status;
  }
}

async function handleResponse(res: Response): Promise<Response> {
  if (res.ok) return res;

  let errorBody: { message?: string; code?: string } = {};
  try {
    errorBody = await res.json();
  } catch {
    // ignore parse errors
  }

  const retryable = res.status === 429 || res.status >= 500;
  throw new ApiError(
    errorBody.message ?? `HTTP ${res.status}`,
    errorBody.code ?? `HTTP_${res.status}`,
    retryable,
    res.status,
  );
}

// ─── sendMessage (non-streaming) ─────────────

export async function sendMessage(
  apiEndpoint: string,
  botId: string,
  sessionId: string,
  message: string,
  pageUrl: string,
  apiKey?: string,
): Promise<Message> {
  const res = await fetch(`${apiEndpoint}/chat`, {
    method: 'POST',
    headers: buildHeaders(undefined, apiKey),
    body: JSON.stringify({ botId, sessionId, message, pageUrl }),
  }).then(handleResponse);

  const data = await res.json();

  return {
    id: data.id ?? uid(),
    role: 'assistant',
    content: data.content ?? '',
    citations: data.citations ?? [],
    timestamp: data.timestamp ?? now(),
  };
}

// ─── streamMessage ────────────────────────────

export async function streamMessage(
  apiEndpoint: string,
  botId: string,
  sessionId: string,
  message: string,
  pageUrl: string,
  onChunk: (chunk: StreamChunk) => void,
  onError: (err: ApiError) => void,
  apiKey?: string,
  signal?: AbortSignal,
): Promise<Message> {
  let accumulatedContent = '';
  let finalCitations: Citation[] = [];
  const messageId = uid();

  try {
    const res = await fetch(`${apiEndpoint}/chat/stream`, {
      method: 'POST',
      headers: buildHeaders({ Accept: 'text/event-stream' }, apiKey),
      body: JSON.stringify({ botId, sessionId, message, pageUrl }),
      signal,
    });

    await handleResponse(res);

    const reader = res.body?.getReader();
    if (!reader) throw new ApiError('No response body', 'NO_BODY', false);

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE: parse `data: {...}\n\n` frames
      const frames = buffer.split('\n\n');
      buffer = frames.pop() ?? '';

      for (const frame of frames) {
        const dataLine = frame.split('\n').find((l) => l.startsWith('data:'));
        if (!dataLine) continue;

        const rawJson = dataLine.slice('data:'.length).trim();
        if (rawJson === '[DONE]') continue;

        try {
          const chunk: StreamChunk = JSON.parse(rawJson);
          accumulatedContent += chunk.delta;
          if (chunk.citations?.length) finalCitations = chunk.citations;
          onChunk(chunk);
        } catch {
          // malformed chunk — skip
        }
      }
    }
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      // silently ignore aborts
    } else {
      const apiErr =
        err instanceof ApiError
          ? err
          : new ApiError(String(err), 'STREAM_ERROR', true);
      onError(apiErr);
    }
  }

  return {
    id: messageId,
    role: 'assistant',
    content: accumulatedContent,
    citations: finalCitations,
    timestamp: now(),
  };
}

// ─── submitFeedback ───────────────────────────

export async function submitFeedback(
  apiEndpoint: string,
  botId: string,
  messageId: string,
  rating: FeedbackRating,
  note?: string,
): Promise<void> {
  const payload: FeedbackPayload = { messageId, rating, note };
  await fetch(`${apiEndpoint}/feedback`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ botId, ...payload }),
  }).then(handleResponse);
}

// ─── requestHandoff ───────────────────────────

export async function requestHandoff(
  apiEndpoint: string,
  botId: string,
  sessionId: string,
  transcript: Message[],
): Promise<{ handoffId: string; message: string }> {
  const payload: HandoffPayload = { sessionId, botId, transcript };
  const res = await fetch(`${apiEndpoint}/handoff`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  }).then(handleResponse);

  return res.json();
}
