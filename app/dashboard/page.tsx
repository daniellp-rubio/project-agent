import { createClient } from '@/lib/supabase/server'
import { TrendingUp, MessageSquare, CheckCircle, Bot } from 'lucide-react'

export default async function DashboardOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, full_name')
    .eq('id', user!.id)
    .single()

  // Métricas de los últimos 30 días
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  const today = new Date().toISOString().split('T')[0]

  const { data: analytics } = await supabase
    .from('analytics_daily')
    .select('*')
    .eq('org_id', profile?.org_id ?? '')
    .gte('date', thirtyDaysAgo)
    .lte('date', today)

  const totals = (analytics ?? []).reduce((acc, row) => ({
    conversations: acc.conversations + row.total_conversations,
    messages: acc.messages + row.total_messages,
    resolved: acc.resolved + row.resolved_count,
  }), { conversations: 0, messages: 0, resolved: 0 })

  const resolutionRate = totals.conversations > 0
    ? Math.round((totals.resolved / totals.conversations) * 100)
    : 0

  const { data: agents } = await supabase
    .from('agents')
    .select('id, name, is_active')
    .eq('org_id', profile?.org_id ?? '')

  const { data: recentConvs } = await supabase
    .from('conversations')
    .select(`
      id, started_at, message_count, is_resolved,
      agent:agents(name),
      classification:classifications(sentiment, intent, summary)
    `)
    .in('agent_id', (agents ?? []).map(a => a.id))
    .order('started_at', { ascending: false })
    .limit(5)

  const { data: suggestions } = await supabase
    .from('prompt_suggestions')
    .select('*, agent:agents(name)')
    .in('agent_id', (agents ?? []).map(a => a.id))
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(3)

  const kpis = [
    {
      label: 'Conversaciones (30d)',
      value: totals.conversations.toLocaleString(),
      icon: MessageSquare,
      color: 'blue',
    },
    {
      label: 'Tasa de resolución',
      value: `${resolutionRate}%`,
      icon: CheckCircle,
      color: 'green',
    },
    {
      label: 'Mensajes enviados',
      value: totals.messages.toLocaleString(),
      icon: TrendingUp,
      color: 'purple',
    },
    {
      label: 'Agentes activos',
      value: (agents ?? []).filter(a => a.is_active).length.toString(),
      icon: Bot,
      color: 'orange',
    },
  ]

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Buenos días{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-slate-500 mt-1">Resumen de los últimos 30 días</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversaciones recientes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Conversaciones recientes</h2>
          {(recentConvs ?? []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Aún no hay conversaciones</p>
          ) : (
            <div className="space-y-3">
              {(recentConvs ?? []).map(conv => {
                const agent = conv.agent as { name: string } | null
                const classification = Array.isArray(conv.classification)
                  ? conv.classification[0]
                  : conv.classification as { sentiment?: string; intent?: string; summary?: string } | null

                const sentimentColor: Record<string, string> = {
                  positivo: 'bg-green-100 text-green-700',
                  neutro: 'bg-slate-100 text-slate-600',
                  negativo: 'bg-red-100 text-red-700',
                }

                return (
                  <a
                    key={conv.id}
                    href={`/dashboard/conversations/${conv.id}`}
                    className="block p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-slate-700">{agent?.name}</span>
                          {classification?.sentiment && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${sentimentColor[classification.sentiment] ?? 'bg-slate-100 text-slate-600'}`}>
                              {classification.sentiment}
                            </span>
                          )}
                          {conv.is_resolved && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                              resuelto
                            </span>
                          )}
                        </div>
                        {classification?.summary && (
                          <p className="text-xs text-slate-500 truncate">{classification.summary}</p>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">
                        {conv.message_count} msgs
                      </span>
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </div>

        {/* Sugerencias de mejora */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Sugerencias de mejora</h2>
          {(suggestions ?? []).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400">Las sugerencias aparecerán cuando haya</p>
              <p className="text-sm text-slate-400">suficientes conversaciones analizadas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(suggestions ?? []).map(s => {
                const agent = s.agent as { name: string } | null
                return (
                  <div key={s.id} className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">💡</span>
                      <div>
                        <p className="text-xs font-medium text-amber-900 mb-1">{agent?.name}</p>
                        <p className="text-xs text-amber-800">{s.suggestion}</p>
                        {s.reasoning && (
                          <p className="text-xs text-amber-600 mt-1">{s.reasoning}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
