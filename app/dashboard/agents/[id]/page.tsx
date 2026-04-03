import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Code, ExternalLink } from 'lucide-react'
import AgentEditForm from './AgentEditForm'

type Props = { params: Promise<{ id: string }> }

export default async function AgentDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('id', id)
    .single()

  if (!agent) notFound()

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/agents"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{agent.name}</h1>
            <p className="text-slate-500 text-sm mt-0.5">Configuración del agente</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/agents/${id}/embed`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-50 border border-slate-200 transition-colors"
          >
            <Code className="w-4 h-4" />
            Embed
          </Link>
          <Link
            href={`/chat/${id}`}
            target="_blank"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500 px-3 py-2 rounded-xl hover:bg-blue-50 border border-blue-200 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Probar
          </Link>
        </div>
      </div>

      <AgentEditForm agent={agent} />
    </div>
  )
}
