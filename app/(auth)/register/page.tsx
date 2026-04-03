'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', orgName: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    // 1. Crear usuario
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName },
      },
    })

    if (authError || !authData.user) {
      setError(authError?.message ?? 'Error al crear cuenta')
      setLoading(false)
      return
    }

    // 2. Crear organización
    const slug = form.orgName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: form.orgName, slug: `${slug}-${Date.now()}` })
      .select()
      .single()

    if (orgError || !org) {
      setError('Error al crear la organización')
      setLoading(false)
      return
    }

    // 3. Vincular perfil a org
    await supabase
      .from('profiles')
      .update({ org_id: org.id, role: 'owner', full_name: form.fullName })
      .eq('id', authData.user.id)

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Crear cuenta</h1>
          <p className="text-slate-500 mt-2">Empieza gratis, sin tarjeta de crédito</p>
        </div>

        <form onSubmit={handleRegister} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {[
            { label: 'Nombre completo', field: 'fullName', type: 'text', placeholder: 'Juan García' },
            { label: 'Nombre de tu empresa', field: 'orgName', type: 'text', placeholder: 'Mi Empresa SL' },
            { label: 'Email', field: 'email', type: 'email', placeholder: 'tu@empresa.com' },
            { label: 'Contraseña', field: 'password', type: 'password', placeholder: '••••••••' },
          ].map(({ label, field, type, placeholder }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
              <input
                type={type}
                value={form[field as keyof typeof form]}
                onChange={e => set(field, e.target.value)}
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={placeholder}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
