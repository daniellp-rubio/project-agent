'use client'

import { useState, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

export function useChat(agentId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sessionId = useRef(uuidv4())

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return
    setError(null)

    const userMsg: ChatMessage = { id: uuidv4(), role: 'user', content: text }
    const assistantMsgId = uuidv4()

    setMessages(prev => [
      ...prev,
      userMsg,
      { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true },
    ])
    setIsLoading(true)

    const history = messages.map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          sessionId: sessionId.current,
          message: text,
          history,
          metadata: {
            url: typeof window !== 'undefined' ? window.location.href : undefined,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          },
        }),
      })

      if (!res.ok) {
        throw new Error('Error al conectar con el agente')
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break

          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'token') {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMsgId
                    ? { ...m, content: m.content + parsed.content }
                    : m
                )
              )
            }
            if (parsed.type === 'done') {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMsgId
                    ? { ...m, isStreaming: false }
                    : m
                )
              )
            }
          } catch {
            // Ignorar líneas malformadas
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setMessages(prev => prev.filter(m => m.id !== assistantMsgId))
    } finally {
      setIsLoading(false)
    }
  }, [agentId, messages, isLoading])

  return { messages, isLoading, error, sendMessage, sessionId: sessionId.current }
}
