import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ConversationsFilter } from './ConversationsFilter'

const SENTIMENT_STYLES: Record<string, string> = {
  positivo: 'bg-green-100 text-green-700',
  neutro: 'bg-slate-100 text-slate-600',
  negativo: 'bg-red-100 text-red-700',
}

const RESOLUTION_STYLES: Record<string, string> = {
  resuelto: 'bg-green-100 text-green-700',
  sin_resolver: 'bg-amber-100 text-amber-700',
  escalado: 'bg-blue-100 text-blue-700',
  fuera_de_scope: 'bg-slate-100 text-slate-600',
}

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ agentId?: string; sentiment?: string; resolution?: string; page?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user!.id)
    .single()

  const { data: agents } = await supabase
    .from('agents')
    .select('id, name')
    .eq('org_id', profile?.org_id ?? '')

  const agentIds = (agents ?? []).map(a => a.id)
  const page = parseInt(params.page ?? '1')
  const pageSize = 20
  const offset = (page - 1) * pageSize

  let query = supabase
    .from('conversations')
    .select(`
      id, started_at, ended_at, message_count, is_resolved, channel,
      agent:agents(name),
      classification:classifications(sentiment, intent, resolution, satisfaction_score, summary)
    `, { count: 'exact' })
    .in('agent_id', agentIds)
    .order('started_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (params.agentId) query = query.eq('agent_id', params.agentId)

  const { data: conversations, count } = await query

  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Conversaciones</h1>
        <p className="text-slate-500 mt-1">{count ?? 0} conversaciones en total</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <ConversationsFilter agents={agents ?? []} currentAgentId={params.agentId} />
      </div>

      {(conversations ?? []).length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Aún no hay conversaciones</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Agente</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Intención</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Sentimiento</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Resolución</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500">Msgs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(conversations ?? []).map(conv => {
                  const agent = conv.agent as { name: string } | null
                  const cl = Array.isArray(conv.classification)
                    ? conv.classification[0]
                    : conv.classification as {
                        sentiment?: string
                        intent?: string
                        resolution?: string
                        satisfaction_score?: number
                        summary?: string
                      } | null

                  return (
                    <tr key={conv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(conv.started_at).toLocaleDateString('es-ES', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">{agent?.name ?? '-'}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {cl?.intent ? (
                          <span className="bg-slate-100 px-2 py-0.5 rounded-full text-xs">{cl.intent}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {cl?.sentiment ? (
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', SENTIMENT_STYLES[cl.sentiment] ?? 'bg-slate-100 text-slate-600')}>
                            {cl.sentiment}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {cl?.resolution ? (
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', RESOLUTION_STYLES[cl.resolution] ?? 'bg-slate-100 text-slate-600')}>
                            {cl.resolution.replace('_', ' ')}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/conversations/${conv.id}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {conv.message_count} →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <Link
                  key={p}
                  href={`/dashboard/conversations?page=${p}`}
                  className={cn(
                    'w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-colors',
                    p === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
