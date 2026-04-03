'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Agent } from '@/lib/supabase/types'

const AVAILABLE_MODELS = [
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'openai/gpt-4o', label: 'GPT-4o' },
  { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku' },
  { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
  { value: 'meta-llama/llama-3.1-8b-instruct', label: 'Llama 3.1 8B' },
  { value: 'google/gemini-flash-1.5', label: 'Gemini Flash 1.5' },
]

export default function AgentEditForm({ agent }: { agent: Agent }) {
  const router = useRouter()
  const widgetCfg = agent.widget_config as {
    primaryColor?: string
    position?: string
    welcomeMessage?: string
    agentName?: string
    showBranding?: boolean
  } | null

  const [form, setForm] = useState({
    name: agent.name,
    description: agent.description ?? '',
    system_prompt: agent.system_prompt,
    model: agent.model,
    temperature: agent.temperature,
    max_tokens: agent.max_tokens,
    is_active: agent.is_active,
    primaryColor: widgetCfg?.primaryColor ?? '#2563eb',
    welcomeMessage: widgetCfg?.welcomeMessage ?? '¡Hola! ¿En qué puedo ayudarte hoy?',
    agentName: widgetCfg?.agentName ?? 'Asistente',
    position: (widgetCfg?.position ?? 'bottom-right') as 'bottom-right' | 'bottom-left',
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string | number | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch(`/api/agents/${agent.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        system_prompt: form.system_prompt,
        model: form.model,
        temperature: form.temperature,
        max_tokens: form.max_tokens,
        is_active: form.is_active,
        widget_config: {
          primaryColor: form.primaryColor,
          welcomeMessage: form.welcomeMessage,
          agentName: form.agentName,
          position: form.position,
          placeholder: 'Escribe tu mensaje...',
          showBranding: widgetCfg?.showBranding ?? true,
        },
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Error al guardar')
    } else {
      setSaved(true)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
          Cambios guardados correctamente
        </div>
      )}

      {/* Estado */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
        <div>
          <p className="font-medium text-slate-900">Estado del agente</p>
          <p className="text-sm text-slate-500">{form.is_active ? 'El agente acepta conversaciones' : 'El agente está desactivado'}</p>
        </div>
        <button
          type="button"
          onClick={() => set('is_active', !form.is_active)}
          className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-blue-600' : 'bg-slate-200'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {/* Básico */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Configuración básica</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Modelo</label>
            <select
              value={form.model}
              onChange={e => set('model', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {AVAILABLE_MODELS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripción del negocio</label>
          <input
            type="text"
            value={form.description}
            onChange={e => set('description', e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* System prompt */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">System Prompt</h2>
        <textarea
          value={form.system_prompt}
          onChange={e => set('system_prompt', e.target.value)}
          required
          rows={12}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Widget */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Widget</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre visible</label>
            <input
              type="text"
              value={form.agentName}
              onChange={e => set('agentName', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={form.primaryColor}
                onChange={e => set('primaryColor', e.target.value)}
                className="h-10 w-14 rounded-xl border border-slate-200 cursor-pointer p-1"
              />
              <input
                type="text"
                value={form.primaryColor}
                onChange={e => set('primaryColor', e.target.value)}
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Mensaje de bienvenida</label>
          <input
            type="text"
            value={form.welcomeMessage}
            onChange={e => set('welcomeMessage', e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
      >
        {loading ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  )
}
