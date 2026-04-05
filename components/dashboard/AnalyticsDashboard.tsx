'use client'

import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, MessageSquare, CheckCircle, Smile } from 'lucide-react'

type Agent = { id: string; name: string }

type AnalyticsData = {
  summary: {
    totalConversations: number
    resolutionRate: number
    sentimentBreakdown: { positive: number; neutral: number; negative: number }
  }
  timeseries: Array<{
    date: string
    total_conversations: number
    resolved_count: number
    sentiment_positive: number
    sentiment_neutral: number
    sentiment_negative: number
  }>
  topIntents: Array<{ intent: string; count: number; percentage: number }>
  topTopics: Array<{ topic: string; count: number }>
  suggestions: Array<{ id: string; agent_id: string; suggestion: string; reasoning: string | null; based_on_convs: number }>
}

const SENTIMENT_COLORS = {
  positive: '#22c55e',
  neutral: '#94a3b8',
  negative: '#ef4444',
}

type Props = { agents: Agent[] }

export default function AnalyticsDashboard({ agents }: Props) {
  const [agentId, setAgentId] = useState<string>('')
  const [range, setRange] = useState('30')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const from = new Date(Date.now() - parseInt(range) * 86400000).toISOString().split('T')[0]
    const to = new Date().toISOString().split('T')[0]
    const params = new URLSearchParams({ from, to })
    if (agentId) params.set('agentId', agentId)

    fetch(`/api/analytics?${params}`)
      .then(res => res.json())
      .then(json => { if (!cancelled) { setData(json); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [agentId, range])

  async function dismissSuggestion(id: string) {
    await fetch('/api/suggestions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'dismissed' }),
    })
    setData(prev => prev ? {
      ...prev,
      suggestions: prev.suggestions.filter(s => s.id !== id)
    } : prev)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const sentimentData = data ? [
    { name: 'Positivo', value: data.summary?.sentimentBreakdown.positive, color: SENTIMENT_COLORS.positive },
    { name: 'Neutro', value: data.summary?.sentimentBreakdown.neutral, color: SENTIMENT_COLORS.neutral },
    { name: 'Negativo', value: data.summary?.sentimentBreakdown.negative, color: SENTIMENT_COLORS.negative },
  ] : []

  const totalSentiment = sentimentData.reduce((s, d) => s + d.value, 0)
  const positiveRate = totalSentiment > 0
    ? Math.round((sentimentData[0].value / totalSentiment) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={agentId}
          onChange={e => { setLoading(true); setAgentId(e.target.value) }}
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los agentes</option>
          {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        <select
          value={range}
          onChange={e => { setLoading(true); setRange(e.target.value) }}
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7">Últimos 7 días</option>
          <option value="30">Últimos 30 días</option>
          <option value="90">Últimos 90 días</option>
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: MessageSquare,
            label: 'Conversaciones',
            value: data?.summary?.totalConversations.toLocaleString() ?? '0',
            color: 'blue',
          },
          {
            icon: CheckCircle,
            label: 'Tasa resolución',
            value: `${Math.round((data?.summary?.resolutionRate ?? 0) * 100)}%`,
            color: 'green',
          },
          {
            icon: Smile,
            label: 'Sentimiento +',
            value: `${positiveRate}%`,
            color: 'purple',
          },
          {
            icon: TrendingUp,
            label: 'Top intención',
            value: data?.topIntents?.[0]?.intent ?? '—',
            color: 'orange',
          },
        ].map(({ icon: Icon, label, value, color }) => {
          const colorMap: Record<string, string> = {
            blue: 'bg-blue-50 text-blue-600',
            green: 'bg-green-50 text-green-600',
            purple: 'bg-purple-50 text-purple-600',
            orange: 'bg-orange-50 text-orange-600',
          }
          return (
            <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xl font-bold text-slate-900 truncate">{value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{label}</p>
            </div>
          )
        })}
      </div>

      {/* Gráfica de volumen */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-6">Volumen de conversaciones</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data?.timeseries ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={d => new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
            />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip
              labelFormatter={d => new Date(d).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long' })}
              contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
            />
            <Line type="monotone" dataKey="total_conversations" stroke="#2563eb" strokeWidth={2} dot={false} name="Conversaciones" />
            <Line type="monotone" dataKey="resolved_count" stroke="#22c55e" strokeWidth={2} dot={false} name="Resueltas" strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentimiento */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-6">Distribución de sentimiento</h2>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={160}>
              <PieChart>
                <Pie data={sentimentData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70}>
                  {sentimentData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {sentimentData.map(s => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-sm text-slate-600 flex-1">{s.name}</span>
                  <span className="text-sm font-semibold text-slate-900">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top intenciones */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-6">Top intenciones</h2>
          {(data?.topIntents ?? []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Sin datos aún</p>
          ) : (
            <div className="space-y-3">
              {(data?.topIntents ?? []).slice(0, 6).map(intent => (
                <div key={intent.intent}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700 font-medium truncate">{intent.intent}</span>
                    <span className="text-slate-500 shrink-0 ml-2">{intent.count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.round(intent.percentage * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Temas más frecuentes */}
      {(data?.topTopics ?? []).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-6">Temas frecuentes</h2>
          <div className="flex flex-wrap gap-2">
            {(data?.topTopics ?? []).map(topic => {
              const maxCount = data!.topTopics[0].count
              const size = 0.75 + (topic.count / maxCount) * 0.75
              return (
                <span
                  key={topic.topic}
                  className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium border border-blue-100 transition-transform hover:scale-105"
                  style={{ fontSize: `${size}rem` }}
                >
                  {topic.topic}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Sugerencias de mejora */}
      {(data?.suggestions ?? []).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Sugerencias para mejorar tu agente</h2>
          <div className="space-y-3">
            {(data?.suggestions ?? []).map(s => (
              <div key={s.id} className="flex gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
                <span className="text-amber-500 text-lg mt-0.5">💡</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">{s.suggestion}</p>
                  {s.reasoning && (
                    <p className="text-xs text-amber-700 mt-1">{s.reasoning}</p>
                  )}
                  <p className="text-xs text-amber-500 mt-1">Basada en {s.based_on_convs} conversaciones</p>
                </div>
                <button
                  onClick={() => dismissSuggestion(s.id)}
                  className="text-amber-400 hover:text-amber-600 text-sm font-medium shrink-0"
                >
                  Descartar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
