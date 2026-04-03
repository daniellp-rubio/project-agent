import { createClient } from '@/lib/supabase/server'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  let org: { id: string; name: string; slug: string; plan: string } | null = null
  if (profile?.org_id) {
    const { data } = await supabase
      .from('organizations')
      .select('id, name, slug, plan')
      .eq('id', profile.org_id)
      .single()
    org = data
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="text-slate-500 mt-1">Gestiona tu cuenta y organización</p>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Tu perfil</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Nombre</dt>
              <dd className="font-medium text-slate-900">{profile?.full_name ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-slate-900">{user?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Rol</dt>
              <dd className="font-medium text-slate-900 capitalize">{profile?.role}</dd>
            </div>
          </dl>
        </div>

        {org && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Organización</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Nombre</dt>
                <dd className="font-medium text-slate-900">{org.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Identificador</dt>
                <dd className="font-mono text-slate-700 text-xs">{org.slug}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Plan</dt>
                <dd>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    org.plan === 'free' ? 'bg-slate-100 text-slate-700'
                    : org.plan === 'pro' ? 'bg-blue-100 text-blue-700'
                    : 'bg-purple-100 text-purple-700'
                  }`}>
                    {org.plan.toUpperCase()}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        )}

        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-2 text-sm">Variables de entorno necesarias</h2>
          <div className="font-mono text-xs space-y-1 text-slate-600">
            <p>NEXT_PUBLIC_SUPABASE_URL</p>
            <p>NEXT_PUBLIC_SUPABASE_ANON_KEY</p>
            <p>SUPABASE_SERVICE_ROLE_KEY</p>
            <p>OPENROUTER_API_KEY</p>
            <p>CLASSIFY_SECRET</p>
          </div>
        </div>
      </div>
    </div>
  )
}
