export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type StreamChatOptions = {
  model: string
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
}

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'

export async function streamChat(options: StreamChatOptions): Promise<Response> {
  const { model, messages, temperature = 0.7, maxTokens = 1000 } = options

  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      'X-Title': 'Agentes Conversacionales',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouter error ${response.status}: ${error}`)
  }

  return response
}

export async function chatCompletion(options: StreamChatOptions): Promise<{
  content: string
  model: string
  tokensUsed: number
}> {
  const { model, messages, temperature = 0.7, maxTokens = 1000 } = options

  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      'X-Title': 'Agentes Conversacionales',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouter error ${response.status}: ${error}`)
  }

  const data = await response.json()
  return {
    content: data.choices[0].message.content,
    model: data.model,
    tokensUsed: data.usage?.total_tokens ?? 0,
  }
}
