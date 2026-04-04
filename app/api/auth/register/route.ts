import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const RegisterSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  orgName: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const { fullName, email, password, orgName } = parsed.data
  const supabase = createAdminClient()

  // 1. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? 'Error al crear el usuario' },
      { status: 400 }
    )
  }

  const userId = authData.user.id

  // 2. Crear organización (con service role, bypasea RLS)
  const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({ name: orgName, slug: `${slug}-${Date.now()}` })
    .select()
    .single()

  if (orgError || !org) {
    // Limpiar el usuario creado si falla la org
    await supabase.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Error al crear la organización' }, { status: 500 })
  }

  // 3. Vincular perfil a la organización
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ org_id: org.id, role: 'owner', full_name: fullName })
    .eq('id', userId)

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Error al configurar el perfil' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
