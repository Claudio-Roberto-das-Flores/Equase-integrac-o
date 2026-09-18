import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import App from '../App'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import CompanyOnboarding from './CompanyOnboarding'
import LoginPage from './LoginPage'
import './auth.css'

type Membership = {
  company_id: string
  role: string
  companies: { id: string; trade_name: string; legal_name: string } | null
}

export default function AuthGate() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [companyId, setCompanyId] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (!nextSession) {
        setMemberships([])
        setCompanyId(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !session) return
    setLoading(true)
    supabase
      .from('company_members')
      .select('company_id, role, companies(id, trade_name, legal_name)')
      .eq('user_id', session.user.id)
      .then(({ data, error }) => {
        if (!error && data) {
          const rows = data as unknown as Membership[]
          setMemberships(rows)
          setCompanyId((current) => current ?? rows[0]?.company_id ?? null)
        }
        setLoading(false)
      })
  }, [session])

  if (!isSupabaseConfigured) return <App />
  if (loading) return <LoadingScreen />
  if (!session) return <LoginPage />
  if (!memberships.length || !companyId) {
    return (
      <CompanyOnboarding
        onCreated={(id) => {
          const appUrl = new URL(import.meta.env.BASE_URL, window.location.origin)
          appUrl.searchParams.set('company', id)
          window.location.assign(appUrl.toString())
        }}
      />
    )
  }

  const currentCompany = memberships.find((membership) => membership.company_id === companyId)?.companies
  return <App companyId={companyId} companyName={currentCompany?.trade_name || currentCompany?.legal_name || 'Minha empresa'} />
}

function LoadingScreen() {
  return (
    <div className="auth-page auth-loading">
      <div className="auth-brand-mark">E</div>
      <strong>Preparando seu ambiente...</strong>
      <span className="auth-spinner" />
    </div>
  )
}
