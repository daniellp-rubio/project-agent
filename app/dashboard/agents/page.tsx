import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Bot, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react'

export default async function AgentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user!.id)
    .single()

  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .eq('org_id', profile?.org_id ?? '')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agentes</h1>
          <p className="text-slate-500 mt-1">Gestiona tus agentes conversacionales</p>
        </div>
        <Link
          href="/dashboard/agents/new"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo agente
        </Link>
      </div>

      {(agents ?? []).length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <Bot className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-slate-700 font-semibold mb-2">Sin agentes todavía</h2>
          <p className="text-slate-400 text-sm mb-6">Crea tu primer agente para empezar a recibir conversaciones</p>
          <Link
            href="/dashboard/agents/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Crear primer agente
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {(agents ?? []).map(agent => {
            const widgetConfig = agent.widget_config as { primaryColor?: string; agentName?: string } | null
            return (
              <div key={agent.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${widgetConfig?.primaryColor ?? '#2563eb'}20` }}
                >
                  <Bot className="w-6 h-6" style={{ color: widgetConfig?.primaryColor ?? '#2563eb' }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{agent.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      agent.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {agent.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  {agent.description && (
                    <p className="text-sm text-slate-500 truncate">{agent.description}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">{agent.model}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/chat/${agent.id}`}
                    target="_blank"
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                    title="Probar agente"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/dashboard/agents/${agent.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Editar
                  </Link>
                  <Link
                    href={`/dashboard/agents/${agent.id}/embed`}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Embed
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
