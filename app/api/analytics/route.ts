import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) return NextResponse.json({ error: 'Sin organización' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const agentId = searchParams.get('agentId')
  const from = searchParams.get('from') ?? new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  const to = searchParams.get('to') ?? new Date().toISOString().split('T')[0]

  // Query analíticas diarias
  let query = supabase
    .from('analytics_daily')
    .select('*')
    .eq('org_id', profile.org_id)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true })

  if (agentId) query = query.eq('agent_id', agentId)

  const { data: dailyData, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Calcular totales
  const totals = (dailyData ?? []).reduce((acc, row) => ({
    totalConversations: acc.totalConversations + row.total_conversations,
    totalMessages: acc.totalMessages + row.total_messages,
    resolvedCount: acc.resolvedCount + row.resolved_count,
    unresolvedCount: acc.unresolvedCount + row.unresolved_count,
    sentimentPositive: acc.sentimentPositive + row.sentiment_positive,
    sentimentNeutral: acc.sentimentNeutral + row.sentiment_neutral,
    sentimentNegative: acc.sentimentNegative + row.sentiment_negative,
  }), {
    totalConversations: 0,
    totalMessages: 0,
    resolvedCount: 0,
    unresolvedCount: 0,
    sentimentPositive: 0,
    sentimentNeutral: 0,
    sentimentNegative: 0,
  })

  const resolutionRate = totals.totalConversations > 0
    ? totals.resolvedCount / totals.totalConversations
    : 0

  // Agregar top intents y topics
  const intentsMap = new Map<string, number>()
  const topicsMap = new Map<string, number>()

  for (const row of dailyData ?? []) {
    const intents = (row.top_intents as { intent: string; count: number }[]) ?? []
    const topics = (row.top_topics as { topic: string; count: number }[]) ?? []

    for (const { intent, count } of intents) {
      intentsMap.set(intent, (intentsMap.get(intent) ?? 0) + count)
    }
    for (const { topic, count } of topics) {
      topicsMap.set(topic, (topicsMap.get(topic) ?? 0) + count)
    }
  }

  const topIntents = Array.from(intentsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([intent, count]) => ({
      intent,
      count,
      percentage: totals.totalConversations > 0 ? count / totals.totalConversations : 0,
    }))

  const topTopics = Array.from(topicsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([topic, count]) => ({ topic, count }))

  // Obtener sugerencias pendientes
  let suggestionsQuery = supabase
    .from('prompt_suggestions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5)

  if (agentId) suggestionsQuery = suggestionsQuery.eq('agent_id', agentId)

  const { data: suggestions } = await suggestionsQuery

  return NextResponse.json({
    summary: {
      totalConversations: totals.totalConversations,
      resolutionRate,
      sentimentBreakdown: {
        positive: totals.sentimentPositive,
        neutral: totals.sentimentNeutral,
        negative: totals.sentimentNegative,
      },
    },
    timeseries: dailyData ?? [],
    topIntents,
    topTopics,
    suggestions: suggestions ?? [],
  })
}
