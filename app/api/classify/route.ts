import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { classifyConversation, generatePromptSuggestion } from '@/lib/openrouter/classify'
import { updateAnalyticsForConversation } from '@/lib/utils/analytics'
import { z } from 'zod'

const ClassifySchema = z.object({
  conversationId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  // Verificar secret interno
  const secret = req.headers.get('x-classify-secret')
  if (secret !== process.env.CLASSIFY_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = ClassifySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'conversationId inválido' }, { status: 400 })
  }

  const { conversationId } = parsed.data
  const supabase = createAdminClient()

  // Obtener mensajes de la conversación
  const { data: messages, error: msgsError } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (msgsError || !messages || messages.length === 0) {
    return NextResponse.json({ error: 'Conversación sin mensajes' }, { status: 404 })
  }

  // Obtener contexto del negocio (system prompt del agente)
  const { data: conv } = await supabase
    .from('conversations')
    .select('agent:agents(name, system_prompt, description)')
    .eq('id', conversationId)
    .single()

  const agent = conv?.agent as { name?: string; system_prompt?: string; description?: string } | null
  const businessContext = agent?.description ?? ''

  // Clasificar
  const classification = await classifyConversation(messages, businessContext)

  // Upsert clasificación
  const { data: savedClass, error: classError } = await supabase
    .from('classifications')
    .upsert({
      conversation_id: conversationId,
      intent: classification.intent,
      sentiment: classification.sentiment,
      urgency: classification.urgency,
      topics: classification.topics,
      resolution: classification.resolution,
      satisfaction_score: classification.satisfaction_score,
      summary: classification.summary,
      improvement_notes: classification.improvement_notes,
      model_used: process.env.OPENROUTER_CLASSIFY_MODEL ?? 'openai/gpt-4o-mini',
    }, { onConflict: 'conversation_id' })
    .select()
    .single()

  if (classError) {
    return NextResponse.json({ error: 'Error al guardar clasificación', details: classError }, { status: 500 })
  }

  // Marcar conversación como resuelta si aplica
  if (classification.resolution === 'resuelto') {
    await supabase
      .from('conversations')
      .update({ is_resolved: true })
      .eq('id', conversationId)
  }

  // Actualizar analytics diarias
  await updateAnalyticsForConversation(conversationId).catch(() => {})

  // Generar sugerencia de prompt si hay improvement_notes (cada 10 conversaciones)
  if (classification.improvement_notes && agent?.name && agent?.system_prompt) {
    const { data: agentData } = await supabase
      .from('conversations')
      .select('agent_id')
      .eq('id', conversationId)
      .single()

    if (agentData) {
      const { count } = await supabase
        .from('classifications')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)

      // Obtener IDs de conversaciones del agente para el subquery
      const { data: agentConvs } = await supabase
        .from('conversations')
        .select('id')
        .eq('agent_id', agentData.agent_id)

      const agentConvIds = (agentConvs ?? []).map(c => c.id)

      // Verificar si debemos generar sugerencia (cada 10 clasificaciones)
      const { count: classCount } = await supabase
        .from('classifications')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', agentConvIds)

      if ((classCount ?? 0) % 10 === 0) {
        const { data: recentNotes } = await supabase
          .from('classifications')
          .select('improvement_notes')
          .in('conversation_id', agentConvIds)
          .not('improvement_notes', 'is', null)
          .order('classified_at', { ascending: false })
          .limit(10)

        const notes = (recentNotes ?? [])
          .map(r => r.improvement_notes)
          .filter(Boolean) as string[]

        if (notes.length >= 3) {
          const suggestion = await generatePromptSuggestion(
            agent.name,
            agent.system_prompt,
            notes
          ).catch(() => null)

          if (suggestion) {
            await supabase.from('prompt_suggestions').insert({
              agent_id: agentData.agent_id,
              suggestion: suggestion.suggestion,
              reasoning: suggestion.reasoning,
              based_on_convs: notes.length,
            })
          }
        }
      }
    }
  }

  return NextResponse.json({ success: true, classification: savedClass })
}
