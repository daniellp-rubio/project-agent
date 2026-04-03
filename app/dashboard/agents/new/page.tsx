'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const AVAILABLE_MODELS = [
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (Recomendado)' },
  { value: 'openai/gpt-4o', label: 'GPT-4o (Más capaz)' },
  { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku (Rápido)' },
  { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (Premium)' },
  { value: 'meta-llama/llama-3.1-8b-instruct', label: 'Llama 3.1 8B (Económico)' },
  { value: 'google/gemini-flash-1.5', label: 'Gemini Flash 1.5' },
]

const DEFAULT_PROMPT = `Eres un asistente de atención al cliente amable, profesional y útil.

Tu objetivo es:
- Responder las preguntas de los usuarios de forma clara y concisa
- Ayudar a resolver problemas con empatía
- Escalar al equipo humano cuando sea necesario indicando que "un agente te contactará pronto"
- Siempre responder en el idioma que use el usuario

Límites:
- No inventes información que no tengas
- No hagas promesas que no puedas cumplir
- Si no sabes algo, dilo honestamente`

export default function NewAgentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    system_prompt: DEFAULT_PROMPT,
    model: 'openai/gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 1000,
    primaryColor: '#2563eb',
    welcomeMessage: '¡Hola! ¿En qué puedo ayudarte hoy?',
    agentName: 'Asistente',
    position: 'bottom-right' as 'bottom-right' | 'bottom-left',
  })

  function set(field: string, value: string | number) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        system_prompt: form.system_prompt,
        model: form.model,
        temperature: form.temperature,
        max_tokens: form.max_tokens,
        widget_config: {
          primaryColor: form.primaryColor,
          welcomeMessage: form.welcomeMessage,
          agentName: form.agentName,
          position: form.position,
          placeholder: 'Escribe tu mensaje...',
          showBranding: true,
        },
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Error al crear agente')
      setLoading(false)
      return
    }

    router.push(`/dashboard/agents/${data.agent.id}`)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/dashboard/agents"
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nuevo agente</h1>
          <p className="text-slate-500 text-sm mt-0.5">Configura tu agente conversacional</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {/* Información básica */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Información básica</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre del agente *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
              placeholder="Ej: Asistente de Soporte"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripción del negocio</label>
            <input
              type="text"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Ej: Tienda online de ropa deportiva"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">Ayuda al clasificador a entender el contexto</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Modelo de IA *</label>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Temperatura: {form.temperature}
              </label>
              <input
                type="range"
                min="0" max="1.5" step="0.1"
                value={form.temperature}
                onChange={e => set('temperature', parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Preciso</span>
                <span>Creativo</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Max tokens</label>
              <input
                type="number"
                min="100" max="4000"
                value={form.max_tokens}
                onChange={e => set('max_tokens', parseInt(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* System Prompt */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-1">System Prompt *</h2>
          <p className="text-sm text-slate-500 mb-4">Define el comportamiento y personalidad del agente</p>
          <textarea
            value={form.system_prompt}
            onChange={e => set('system_prompt', e.target.value)}
            required
            rows={10}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Widget config */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Configuración del widget</h2>

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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Color principal</label>
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Posición</label>
            <select
              value={form.position}
              onChange={e => set('position', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="bottom-right">Inferior derecha</option>
              <option value="bottom-left">Inferior izquierda</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href="/dashboard/agents"
            className="flex-1 text-center py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            {loading ? 'Creando...' : 'Crear agente'}
          </button>
        </div>
      </form>
    </div>
  )
}
