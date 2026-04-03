import { createAdminClient } from '@/lib/supabase/admin'

export async function updateAnalyticsForConversation(conversationId: string) {
  const supabase = createAdminClient()

  // Obtener conversación con clasificación
  const { data: conv } = await supabase
    .from('conversations')
    .select(`
      *,
      agent:agents(org_id),
      classification:classifications(*)
    `)
    .eq('id', conversationId)
    .single()

  if (!conv || !conv.agent) return

  const today = new Date().toISOString().split('T')[0]
  const orgId = (conv.agent as { org_id: string }).org_id
  const agentId = conv.agent_id

  // Obtener mensajes para latencia
  const { data: msgs } = await supabase
    .from('messages')
    .select('latency_ms, role')
    .eq('conversation_id', conversationId)
    .eq('role', 'assistant')

  const avgLatency = msgs?.length
    ? msgs.reduce((acc, m) => acc + (m.latency_ms ?? 0), 0) / msgs.length
    : 0

  const classification = Array.isArray(conv.classification)
    ? conv.classification[0]
    : conv.classification

  // Upsert analytics_daily
  const { data: existing } = await supabase
    .from('analytics_daily')
    .select('*')
    .eq('org_id', orgId)
    .eq('agent_id', agentId)
    .eq('date', today)
    .single()

  if (existing) {
    const sentimentField =
      classification?.sentiment === 'positivo' ? 'sentiment_positive'
      : classification?.sentiment === 'negativo' ? 'sentiment_negative'
      : 'sentiment_neutral'

    await supabase
      .from('analytics_daily')
      .update({
        total_conversations: existing.total_conversations + 1,
        total_messages: existing.total_messages + conv.message_count,
        avg_messages_per_conv: (existing.total_messages + conv.message_count) / (existing.total_conversations + 1),
        avg_latency_ms: (existing.avg_latency_ms + avgLatency) / 2,
        resolved_count: existing.resolved_count + (conv.is_resolved ? 1 : 0),
        unresolved_count: existing.unresolved_count + (conv.is_resolved ? 0 : 1),
        [sentimentField]: (existing[sentimentField as keyof typeof existing] as number) + 1,
      })
      .eq('id', existing.id)
  } else {
    await supabase.from('analytics_daily').insert({
      org_id: orgId,
      agent_id: agentId,
      date: today,
      total_conversations: 1,
      total_messages: conv.message_count,
      avg_messages_per_conv: conv.message_count,
      avg_latency_ms: avgLatency,
      resolved_count: conv.is_resolved ? 1 : 0,
      unresolved_count: conv.is_resolved ? 0 : 1,
      sentiment_positive: classification?.sentiment === 'positivo' ? 1 : 0,
      sentiment_neutral: classification?.sentiment === 'neutro' ? 1 : 0,
      sentiment_negative: classification?.sentiment === 'negativo' ? 1 : 0,
    })
  }
}
