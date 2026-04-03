import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import ChatWidget from '@/components/chat/ChatWidget'
import type { WidgetConfig } from '@/lib/supabase/types'

type Props = { params: Promise<{ agentId: string }> }

export default async function ChatPage({ params }: Props) {
  const { agentId } = await params
  const supabase = createAdminClient()

  const { data: agent } = await supabase
    .from('agents')
    .select('id, name, widget_config, is_active')
    .eq('id', agentId)
    .eq('is_active', true)
    .single()

  if (!agent) notFound()

  const defaultConfig: WidgetConfig = {
    primaryColor: '#2563eb',
    position: 'bottom-right',
    welcomeMessage: '¡Hola! ¿En qué puedo ayudarte hoy?',
    placeholder: 'Escribe tu mensaje...',
    agentName: 'Asistente',
    showBranding: true,
  }

  const config: WidgetConfig = {
    ...defaultConfig,
    ...(agent.widget_config as Partial<WidgetConfig> | null ?? {}),
  }

  return (
    <div className="w-full h-screen flex flex-col">
      <ChatWidget agentId={agentId} config={config} standalone={true} />
    </div>
  )
}
