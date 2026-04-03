import { createClient } from '@/lib/supabase/server'
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user!.id)
    .single()

  const { data: agents } = await supabase
    .from('agents')
    .select('id, name')
    .eq('org_id', profile?.org_id ?? '')

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Analíticas</h1>
        <p className="text-slate-500 mt-1">Insights sobre tus conversaciones</p>
      </div>
      <AnalyticsDashboard agents={agents ?? []} />
    </div>
  )
}
