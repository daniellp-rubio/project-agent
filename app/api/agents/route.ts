import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const CreateAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  system_prompt: z.string().min(10).max(10000),
  model: z.string().default('openai/gpt-4o-mini'),
  temperature: z.number().min(0).max(2).default(0.7),
  max_tokens: z.number().min(100).max(8000).default(1000),
  language: z.string().default('es'),
  widget_config: z.object({
    primaryColor: z.string().default('#2563eb'),
    position: z.enum(['bottom-right', 'bottom-left']).default('bottom-right'),
    welcomeMessage: z.string().default('¡Hola! ¿En qué puedo ayudarte hoy?'),
    placeholder: z.string().default('Escribe tu mensaje...'),
    agentName: z.string().default('Asistente'),
    showBranding: z.boolean().default(true),
  }).optional(),
  allowed_origins: z.array(z.string()).default(['*']),
})

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) {
    return NextResponse.json({ error: 'Sin organización' }, { status: 403 })
  }

  const { data: agents, error } = await supabase
    .from('agents')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ agents })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id || !['owner', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = CreateAgentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.issues }, { status: 400 })
  }

  const { data: agent, error } = await supabase
    .from('agents')
    .insert({ ...parsed.data, org_id: profile.org_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ agent }, { status: 201 })
}
