import { Router, type Request, type Response } from 'express'
import { ChatRequestSchema, type ChatMessage } from '../types/chat.types'

export const chatRouter: Router = Router()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sendEvent(res: Response, payload: unknown): void {
  res.write(JSON.stringify(payload) + '\n')
}

function streamHeaders(res: Response): void {
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
}

function lastUserText(messages: ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') return messages[i].content
  }
  return ''
}

// ---------------------------------------------------------------------------
// Demo mode (no API key configured) — streams a friendly sample reply so the
// UI is fully demonstrable. Real responses are returned once AI_API_KEY is set.
// ---------------------------------------------------------------------------

function buildDemoReply(messages: ChatMessage[]): string {
  const userText = lastUserText(messages)
  const preview = userText ? `「${userText.slice(0, 80)}」` : '你的问题'
  return (
    `（演示模式）你刚才提到 ${preview}。\n\n` +
    `当前服务未配置大模型 API Key，因此返回的是示例内容。\n\n` +
    `要获得真实、智能的回复，只需在 backend 目录的 .env 文件中填写：` +
    `AI_API_KEY（支持 OpenAI、DeepSeek 等 OpenAI 兼容接口），保存后刷新页面即可。\n\n` +
    `✨ Mornrain 内置多位专家角色：写作大师、翻译官、程序员、情感树洞、简历优化师、旅行规划师，` +
    `切换角色即可获得更专业的对话体验。`
  )
}

async function streamDemo(res: Response, messages: ChatMessage[]): Promise<void> {
  streamHeaders(res)
  const text = buildDemoReply(messages)
  const chunkSize = 3
  for (let i = 0; i < text.length; i += chunkSize) {
    await new Promise((r) => setTimeout(r, 16))
    sendEvent(res, { type: 'delta', content: text.slice(i, i + chunkSize) })
  }
  sendEvent(res, { type: 'done' })
  res.end()
}

// ---------------------------------------------------------------------------
// Real streaming via OpenAI-compatible Chat Completions API
// ---------------------------------------------------------------------------

async function streamFromProvider(
  res: Response,
  messages: ChatMessage[],
  model?: string,
  temperature?: number
): Promise<void> {
  const apiKey = process.env.AI_API_KEY
  const baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
  const modelName = model || process.env.AI_MODEL || 'gpt-4o-mini'

  const upstream = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages,
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      stream: true,
    }),
  })

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '')
    sendEvent(res, {
      type: 'error',
      message: `大模型服务返回错误（${upstream.status}）。请检查 API Key、Base URL 与模型名称是否正确。`,
      detail: detail.slice(0, 400),
    })
    res.end()
    return
  }

  streamHeaders(res)
  const reader = upstream.body.getReader()
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
      if (!trimmed || !trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') {
        sendEvent(res, { type: 'done' })
        continue
      }
      try {
        const json = JSON.parse(data)
        const delta: string | undefined = json.choices?.[0]?.delta?.content
        if (delta) sendEvent(res, { type: 'delta', content: delta })
      } catch {
        // ignore malformed keep-alive lines
      }
    }
  }
  sendEvent(res, { type: 'done' })
  res.end()
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

chatRouter.post('/chat', async (req: Request, res: Response) => {
  const parsed = ChatRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', detail: parsed.error.flatten() })
    return
  }

  const { messages, model, temperature } = parsed.data

  // Abort the upstream request if the client disconnects.
  let aborted = false
  req.on('close', () => {
    aborted = true
  })

  try {
    if (!process.env.AI_API_KEY) {
      await streamDemo(res, messages)
    } else {
      await streamFromProvider(res, messages, model, temperature)
    }
  } catch (err) {
    if (!aborted && !res.writableEnded) {
      sendEvent(res, { type: 'error', message: `服务异常：${(err as Error).message}` })
      res.end()
    }
  }
})
