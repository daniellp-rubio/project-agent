import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Copy } from 'lucide-react'
import CopyButton from '@/components/dashboard/CopyButton'

type Props = { params: Promise<{ id: string }> }

export default async function EmbedPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: agent } = await supabase
    .from('agents')
    .select('id, name, widget_config')
    .eq('id', id)
    .single()

  if (!agent) notFound()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tu-dominio.com'
  const widgetConfig = agent.widget_config as { primaryColor?: string; position?: string } | null

  const scriptTag = `<script
  src="${appUrl}/embed.js"
  data-agent-id="${agent.id}"
  data-position="${widgetConfig?.position ?? 'bottom-right'}"
  data-primary-color="${widgetConfig?.primaryColor ?? '#2563eb'}"
></script>`

  const iframeCode = `<iframe
  src="${appUrl}/chat/${agent.id}"
  width="400"
  height="600"
  frameborder="0"
  style="border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.1);"
></iframe>`

  const apiExample = `// Usando la API directamente
const response = await fetch('${appUrl}/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentId: '${agent.id}',
    sessionId: 'session-unica-del-usuario',
    message: 'Hola, tengo una pregunta',
    history: []
  })
})

// Leer el stream SSE
const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const lines = decoder.decode(value).split('\\n')
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6))
      if (data.type === 'token') process.stdout.write(data.content)
      if (data.type === 'done') console.log('\\nFin:', data.conversationId)
    }
  }
}`

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/dashboard/agents/${id}`}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Integración</h1>
          <p className="text-slate-500 text-sm mt-0.5">Cómo integrar {agent.name} en tu web</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Script tag */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="font-semibold text-slate-900">Opción 1: Script (recomendado)</h2>
              <p className="text-sm text-slate-500 mt-0.5">Pega este código antes del cierre de &lt;/body&gt;</p>
            </div>
            <CopyButton text={scriptTag} />
          </div>
          <pre className="bg-slate-50 rounded-xl p-4 text-xs text-slate-700 overflow-x-auto font-mono whitespace-pre-wrap">
            {scriptTag}
          </pre>
        </div>

        {/* iFrame */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="font-semibold text-slate-900">Opción 2: iFrame</h2>
              <p className="text-sm text-slate-500 mt-0.5">Para embeber el chat en una sección específica</p>
            </div>
            <CopyButton text={iframeCode} />
          </div>
          <pre className="bg-slate-50 rounded-xl p-4 text-xs text-slate-700 overflow-x-auto font-mono whitespace-pre-wrap">
            {iframeCode}
          </pre>
        </div>

        {/* API directa */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="font-semibold text-slate-900">Opción 3: API directa</h2>
              <p className="text-sm text-slate-500 mt-0.5">Para integraciones custom o backends propios</p>
            </div>
            <CopyButton text={apiExample} />
          </div>
          <pre className="bg-slate-50 rounded-xl p-4 text-xs text-slate-700 overflow-x-auto font-mono whitespace-pre-wrap">
            {apiExample}
          </pre>
        </div>

        {/* Test link */}
        <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5 flex items-center justify-between">
          <div>
            <p className="font-medium text-blue-900">Probar el widget</p>
            <p className="text-sm text-blue-600 mt-0.5">Abre el chat en una nueva pestaña</p>
          </div>
          <Link
            href={`/chat/${agent.id}`}
            target="_blank"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
          >
            Abrir chat
          </Link>
        </div>
      </div>
    </div>
  )
}
