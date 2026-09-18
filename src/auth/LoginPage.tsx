import { useState, type FormEvent } from 'react'
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'

type Mode = 'login' | 'signup' | 'forgot'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase) return
    setBusy(true)
    setMessage(null)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        })
        if (error) throw error
        setMessage({ kind: 'success', text: 'Cadastro realizado. Verifique seu e-mail para confirmar a conta.' })
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        })
        if (error) throw error
        setMessage({ kind: 'success', text: 'Enviamos as instruções de recuperação para seu e-mail.' })
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.'
      setMessage({ kind: 'error', text })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-presentation">
        <div className="auth-brand"><span className="auth-brand-mark">E</span><div><strong>Equase</strong><small>Integração</small></div></div>
        <div className="auth-copy">
          <span className="auth-tag">GESTÃO EMPRESARIAL INTEGRADA</span>
          <h1>Todo o seu negócio.<br />Em um só lugar.</h1>
          <p>Estoque, vendas, financeiro e documentos fiscais conectados para você tomar decisões com segurança.</p>
        </div>
        <p className="auth-security">Seus dados protegidos com acesso individual por empresa.</p>
      </section>

      <section className="auth-form-side">
        <form className="auth-card" onSubmit={submit}>
          {mode !== 'login' && <button className="auth-back" type="button" onClick={() => { setMode('login'); setMessage(null) }}><ArrowLeft size={16} /> Voltar</button>}
          <span className="auth-overline">BEM-VINDO</span>
          <h2>{mode === 'login' ? 'Acesse sua conta' : mode === 'signup' ? 'Crie sua conta' : 'Recupere sua senha'}</h2>
          <p>{mode === 'forgot' ? 'Informe seu e-mail e enviaremos as instruções.' : 'Entre para continuar gerenciando sua empresa.'}</p>

          {mode === 'signup' && <label>Nome completo<div className="auth-input"><Mail size={17} /><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required /></div></label>}
          <label>E-mail<div className="auth-input"><Mail size={17} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" autoComplete="email" required /></div></label>
          {mode !== 'forgot' && <label>Senha<div className="auth-input"><LockKeyhole size={17} /><input type={visible ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo de 8 caracteres" minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required /><button type="button" onClick={() => setVisible(!visible)} aria-label="Mostrar senha">{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>}

          {mode === 'login' && <button className="forgot-link" type="button" onClick={() => { setMode('forgot'); setMessage(null) }}>Esqueci minha senha</button>}
          {message && <div className={`auth-message ${message.kind}`}>{message.text}</div>}
          <button className="auth-submit" disabled={busy}>{busy ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar instruções'}</button>

          {mode === 'login' && <div className="auth-signup">Ainda não possui conta? <button type="button" onClick={() => { setMode('signup'); setMessage(null) }}>Cadastre-se</button></div>}
        </form>
      </section>
    </div>
  )
}
