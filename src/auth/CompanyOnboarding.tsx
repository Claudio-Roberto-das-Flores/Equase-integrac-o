import { useState, type FormEvent } from 'react'
import { Building2, CheckCircle2, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function CompanyOnboarding({ onCreated }: { onCreated: (companyId: string) => void }) {
  const [legalName, setLegalName] = useState('')
  const [tradeName, setTradeName] = useState('')
  const [document, setDocument] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError('')
    const cleanDocument = document.replace(/\D/g, '')
    const { data, error: requestError } = await supabase.rpc('create_company', {
      company_legal_name: legalName.trim(),
      company_trade_name: tradeName.trim(),
      company_document: cleanDocument,
    })
    setBusy(false)
    if (requestError) return setError(requestError.message)
    onCreated(data as string)
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-top"><div className="auth-brand"><span className="auth-brand-mark">E</span><div><strong>Equase</strong><small>Integração</small></div></div><button onClick={() => supabase?.auth.signOut()}><LogOut size={16} /> Sair</button></div>
      <main className="onboarding-card">
        <span className="onboarding-icon"><Building2 size={28} /></span>
        <span className="auth-overline">PRIMEIROS PASSOS</span>
        <h1>Cadastre sua empresa</h1>
        <p>Essas informações criam o ambiente separado e seguro da sua empresa. Você poderá completar os dados fiscais depois.</p>
        <form onSubmit={submit}>
          <label>Razão social<input value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Nome empresarial completo" required /></label>
          <label>Nome fantasia<input value={tradeName} onChange={(e) => setTradeName(e.target.value)} placeholder="Como a empresa é conhecida" required /></label>
          <label>CNPJ<input value={document} onChange={(e) => setDocument(e.target.value)} placeholder="00.000.000/0000-00" inputMode="numeric" minLength={14} required /></label>
          <div className="onboarding-info"><CheckCircle2 size={18} /><span>Criaremos automaticamente o estoque e o caixa principal.</span></div>
          {error && <div className="auth-message error">{error}</div>}
          <button className="auth-submit" disabled={busy}>{busy ? 'Criando empresa...' : 'Criar empresa e continuar'}</button>
        </form>
      </main>
    </div>
  )
}
