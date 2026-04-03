import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  let org: { name: string; plan: string } | null = null
  if (profile?.org_id) {
    const { data } = await supabase
      .from('organizations')
      .select('name, plan')
      .eq('id', profile.org_id)
      .single()
    org = data
  }

  return (
    <div className="flex h-full bg-slate-50">
      <Sidebar
        profile={profile}
        org={org}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
