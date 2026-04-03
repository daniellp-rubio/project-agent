import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type Props = { params: Promise<{ id: string }> }

export default async function ConversationDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: conv } = await supabase
    .from('conversations')
    .select(`
      *,
      agent:agents(name, system_prompt)
    `)
    .eq('id', id)
    .single()

  if (!conv) notFound()

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', id)
    .neq('role', 'system')
    .order('created_at', { ascending: true })

  const { data: classification } = await supabase
    .from('classifications')
    .select('*')
    .eq('conversation_id', id)
    .single()

  const agent = conv.agent as { name: string; system_prompt: string } | null

  const sentimentColor: Record<string, string> = {
    positivo: 'text-green-600',
    neutro: 'text-slate-500',
    negativo: 'text-red-600',
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/conversations"
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Conversación</h1>
          <p className="text-slate-500 text-sm">{agent?.name} · {new Date(conv.started_at).toLocaleString('es-ES')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline de mensajes */}
        <div className="lg:col-span-2 space-y-3">
          {(messages ?? []).map(msg => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-3',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-1">
                  <span className="text-xs font-bold text-blue-600">A</span>
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                )}
              >
                {msg.content}
                {msg.latency_ms && msg.role === 'assistant' && (
                  <p className="text-xs opacity-50 mt-1">{msg.latency_ms}ms</p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center shrink-0 mt-1">
                  <span className="text-xs font-bold text-slate-500">U</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Panel de clasificación */}
        <div className="space-y-4">
          {classification ? (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h2 className="font-semibold text-slate-900 mb-4">Clasificación</h2>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Intención</dt>
                    <dd className="text-slate-800 font-medium">{classification.intent ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Sentimiento</dt>
                    <dd className={cn('font-medium', sentimentColor[classification.sentiment ?? ''] ?? 'text-slate-600')}>
                      {classification.sentiment ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Urgencia</dt>
                    <dd className="text-slate-800">{classification.urgency ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Resolución</dt>
                    <dd className="text-slate-800">{classification.resolution?.replace('_', ' ') ?? '—'}</dd>
                  </div>
                  {classification.satisfaction_score && (
                    <div>
                      <dt className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">CSAT</dt>
                      <dd className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="font-semibold text-slate-800">{classification.satisfaction_score.toFixed(1)}</span>
                        <span className="text-slate-400 text-xs">/5</span>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {(classification.topics?.length ?? 0) > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-semibold text-slate-900 mb-3 text-sm">Temas detectados</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {classification.topics.map(topic => (
                      <span key={topic} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {classification.summary && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-semibold text-slate-900 mb-2 text-sm">Resumen</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{classification.summary}</p>
                </div>
              )}

              {classification.improvement_notes && (
                <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
                  <h3 className="font-semibold text-amber-900 mb-2 text-sm flex items-center gap-1.5">
                    💡 Nota de mejora
                  </h3>
                  <p className="text-sm text-amber-800 leading-relaxed">{classification.improvement_notes}</p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
              <p className="text-sm text-slate-400">Esta conversación aún no ha sido clasificada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
