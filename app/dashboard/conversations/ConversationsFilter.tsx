'use client'

import { useRouter } from 'next/navigation'

type Agent = { id: string; name: string }

export function ConversationsFilter({
  agents,
  currentAgentId,
}: {
  agents: Agent[]
  currentAgentId?: string
}) {
  const router = useRouter()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const url = new URL(window.location.href)
    if (e.target.value) url.searchParams.set('agentId', e.target.value)
    else url.searchParams.delete('agentId')
    url.searchParams.delete('page')
    router.push(url.pathname + url.search)
  }

  return (
    <select
      defaultValue={currentAgentId ?? ''}
      onChange={handleChange}
      className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Todos los agentes</option>
      {agents.map(a => (
        <option key={a.id} value={a.id}>{a.name}</option>
      ))}
    </select>
  )
}
