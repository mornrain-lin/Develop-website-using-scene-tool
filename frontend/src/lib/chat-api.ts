import type { ApiMessage } from '@/types/chat'

export interface StreamChunk {
  type: 'delta' | 'done' | 'error'
  content?: string
  message?: string
  detail?: string
}

/**
 * Stream a chat completion from the backend. The backend emits newline-delimited
 * JSON chunks of shape { type: 'delta' | 'done' | 'error', ... }.
 */
export async function* streamChat(
  messages: ApiMessage[],
  opts?: { model?: string; temperature?: number; signal?: AbortSignal }
): AsyncGenerator<StreamChunk> {
  let res: Response
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model: opts?.model,
        temperature: opts?.temperature,
      }),
      signal: opts?.signal,
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') return
    yield { type: 'error', message: '网络请求失败，请检查网络连接。' }
    return
  }

  if (!res.ok || !res.body) {
    let message = `请求失败（${res.status}）`
    try {
      const j = (await res.json()) as { error?: string; message?: string }
      if (j.error || j.message) message = j.error || j.message || message
    } catch {
      /* ignore */
    }
    yield { type: 'error', message }
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        const json = JSON.parse(trimmed) as StreamChunk
        if (json.type === 'delta') yield { type: 'delta', content: json.content ?? '' }
        else if (json.type === 'done') yield { type: 'done' }
        else if (json.type === 'error') yield { type: 'error', message: json.message ?? '未知错误' }
      } catch {
        /* ignore malformed line */
      }
    }
  }
}
