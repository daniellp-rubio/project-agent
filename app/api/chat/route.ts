import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { streamChat, ChatMessage } from '@/lib/openrouter/chat'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

const ChatRequestSchema = z.object({
  agentId: z.string().uuid(),
  sessionId: z.string().min(1),
  message: z.string().min(1).max(4000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(50).default([]),
  metadata: z.object({
    url: z.string().optional(),
    userAgent: z.string().optional(),
    customData: z.record(z.string(), z.unknown()).optional(),
  }).optional(),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = ChatRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Parámetros inválidos', details: parsed.error.issues }, { status: 400 })
  }

  const { agentId, sessionId, message, history, metadata } = parsed.data
  const supabase = createAdminClient()

  // Cargar agente
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .eq('is_active', true)
    .single()

  if (agentError || !agent) {
    return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 })
  }

  // Validar origen si hay allowed_origins definidos
  const origin = req.headers.get('origin') ?? ''
  if (!agent.allowed_origins.includes('*') && !agent.allowed_origins.includes(origin)) {
    return NextResponse.json({ error: 'Origen no autorizado' }, { status: 403 })
  }

  // Obtener o crear conversación
  let conversationId: string

  const { data: existingConv } = await supabase
    .from('conversations')
    .select('id')
    .eq('agent_id', agentId)
    .eq('session_id', sessionId)
    .single()

  if (existingConv) {
    conversationId = existingConv.id
  } else {
    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({
        agent_id: agentId,
        session_id: sessionId,
        channel: 'web',
        metadata: (metadata ?? {}) as import('@/lib/supabase/types').Json,
      })
      .select('id')
      .single()

    if (convError || !newConv) {
      return NextResponse.json({ error: 'Error al crear conversación' }, { status: 500 })
    }
    conversationId = newConv.id
  }

  // Guardar mensaje del usuario
  const userMessageId = uuidv4()
  await supabase.from('messages').insert({
    id: userMessageId,
    conversation_id: conversationId,
    role: 'user',
    content: message,
  })

  // Construir historial para OpenRouter
  const openRouterMessages: ChatMessage[] = [
    { role: 'system', content: agent.system_prompt },
    ...history.slice(-20), // últimos 20 para no exceder contexto
    { role: 'user', content: message },
  ]

  const startTime = Date.now()
  const assistantMessageId = uuidv4()

  // Hacer streaming
  let streamResponse: Response
  try {
    streamResponse = await streamChat({
      model: agent.model,
      messages: openRouterMessages,
      temperature: agent.temperature,
      maxTokens: agent.max_tokens,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Error al conectar con el modelo de IA' }, { status: 502 })
  }

  // Crear TransformStream para interceptar tokens y guardar al final
  let fullContent = ''
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const transformStream = new TransformStream({
    async transform(chunk, controller) {
      const text = decoder.decode(chunk)
      const lines = text.split('\n').filter(line => line.trim())

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            // Guardar mensaje del asistente
            const latencyMs = Date.now() - startTime
            await supabase.from('messages').insert({
              id: assistantMessageId,
              conversation_id: conversationId,
              role: 'assistant',
              content: fullContent,
              model_used: agent.model,
              latency_ms: latencyMs,
            })

            // Disparar clasificación en background cada 5 mensajes o al final
            const { data: conv } = await supabase
              .from('conversations')
              .select('message_count')
              .eq('id', conversationId)
              .single()

            if (conv && conv.message_count >= 4 && conv.message_count % 4 === 0) {
              fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/classify`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-classify-secret': process.env.CLASSIFY_SECRET ?? '',
                },
                body: JSON.stringify({ conversationId }),
              }).catch(() => {})
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'done',
              conversationId,
              messageId: assistantMessageId,
            })}\n\n`))
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            continue
          }

          try {
            const parsed = JSON.parse(data)
            const token = parsed.choices?.[0]?.delta?.content
            if (token) {
              fullContent += token
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'token',
                content: token,
              })}\n\n`))
            }
          } catch {
            // Ignorar líneas no parseables
          }
        }
      }
    },
  })

  return new Response(streamResponse.body!.pipeThrough(transformStream), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
