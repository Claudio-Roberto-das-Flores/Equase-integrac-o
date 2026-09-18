import { useMemo, useState, type ComponentType } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeDollarSign,
  Bell,
  Boxes,
  Building2,
  ChevronDown,
  CircleDollarSign,
  FileCheck2,
  FileText,
  Gauge,
  HandCoins,
  Menu,
  PackageCheck,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Users,
  WalletCards,
  X,
} from 'lucide-react'
import RegistrationsPage from './modules/RegistrationsPage'
import InventoryPage from './modules/InventoryPage'

type NavItem = { label: string; icon: ComponentType<{ size?: number; strokeWidth?: number }> }

const navigation: NavItem[] = [
  { label: 'Visão geral', icon: Gauge },
  { label: 'Cadastros', icon: Users },
  { label: 'Estoque', icon: Boxes },
  { label: 'Compras', icon: ShoppingCart },
  { label: 'Vendas', icon: ShoppingBag },
  { label: 'Financeiro', icon: CircleDollarSign },
  { label: 'Documentos fiscais', icon: ReceiptText },
  { label: 'Entregas', icon: Truck },
]

const modules = [
  { title: 'Cadastros', detail: '128 clientes · 34 fornecedores', icon: Users, tone: 'sage' },
  { title: 'Estoque', detail: '842 itens · 6 com estoque baixo', icon: Boxes, tone: 'amber' },
  { title: 'Compras', detail: '12 pedidos em andamento', icon: ShoppingCart, tone: 'blue' },
  { title: 'Vendas', detail: 'R$ 48.720 neste mês', icon: ShoppingBag, tone: 'rose' },
  { title: 'Financeiro', detail: 'Fluxo de caixa atualizado', icon: WalletCards, tone: 'violet' },
  { title: 'Fiscal e XML', detail: '3 documentos para conferir', icon: FileCheck2, tone: 'teal' },
]

const activities = [
  { title: 'Venda #1048 confirmada', meta: 'Loja Centro · há 12 minutos', value: '+ R$ 1.280,00', kind: 'positive' },
  { title: 'XML de compra importado', meta: 'Distribuidora Nacional · há 38 minutos', value: '24 itens', kind: 'neutral' },
  { title: 'Pagamento realizado', meta: 'Fornecedor Bella · há 1 hora', value: '- R$ 860,00', kind: 'negative' },
  { title: 'Estoque atualizado', meta: 'Entrada do pedido #PC-209 · há 2 horas', value: '52 unidades', kind: 'neutral' },
]

function App({ companyId, companyName = 'Equase Desenvolvimento' }: { companyId?: string; companyName?: string }) {
  const [active, setActive] = useState('Visão geral')
  const [menuOpen, setMenuOpen] = useState(false)
  const [period, setPeriod] = useState('Este mês')
  const today = useMemo(
    () => new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date()),
    [],
  )

  const selectSection = (label: string) => {
    setActive(label)
    setMenuOpen(false)
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">E</div>
          <div><strong>Equase</strong><span>Integração</span></div>
        </div>
        <button className="close-menu" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X size={22} /></button>

        <div className="company-switcher">
          <Building2 size={19} />
          <div><span>Empresa atual</span><strong>{companyName}</strong></div>
          <ChevronDown size={16} />
        </div>

        <nav>
          <p className="nav-heading">GESTÃO</p>
          {navigation.map(({ label, icon: Icon }) => (
            <button key={label} className={active === label ? 'active' : ''} onClick={() => selectSection(label)}>
              <Icon size={19} strokeWidth={1.8} /><span>{label}</span>
              {label === 'Estoque' && <em>6</em>}
            </button>
          ))}
          <p className="nav-heading second">SISTEMA</p>
          <button onClick={() => selectSection('Configurações')} className={active === 'Configurações' ? 'active' : ''}>
            <Settings size={19} strokeWidth={1.8} /><span>Configurações</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="avatar">CF</div>
          <div><strong>Claudio Flores</strong><span>Administrador</span></div>
          <ChevronDown size={16} />
        </div>
      </aside>

      {menuOpen && <button className="backdrop" onClick={() => setMenuOpen(false)} aria-label="Fechar menu" />}

      <main>
        <header>
          <button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Menu /></button>
          <div className="search"><Search size={19} /><input placeholder="Buscar clientes, produtos ou pedidos..." /></div>
          <div className="header-actions">
            <button className="icon-button"><Bell size={20} /><i /></button>
            <button className="new-button"><Plus size={18} /> Novo lançamento</button>
          </div>
        </header>

        <div className="content">
          <section className="page-heading">
            <div><span className="eyebrow">{today}</span><h1>{active}</h1><p>{active === 'Cadastros' ? 'Organize clientes, fornecedores, produtos e serviços.' : 'Acompanhe os principais números e movimentações da sua empresa.'}</p></div>
            {active === 'Visão geral' && <label className="period-select">Período<select value={period} onChange={(e) => setPeriod(e.target.value)}><option>Hoje</option><option>Esta semana</option><option>Este mês</option><option>Este ano</option></select></label>}
          </section>

          {active === 'Cadastros' && companyId ? <RegistrationsPage companyId={companyId} /> : active === 'Estoque' && companyId ? <InventoryPage companyId={companyId} /> : <Dashboard selectSection={selectSection} />}
        </div>
      </main>
    </div>
  )
}

function Dashboard({ selectSection }: { selectSection: (label: string) => void }) {
  return <>

          <section className="metrics-grid">
            <Metric title="Faturamento" value="R$ 48.720" change="12,8%" positive icon={BadgeDollarSign} />
            <Metric title="A receber" value="R$ 16.450" change="8,2%" positive icon={HandCoins} />
            <Metric title="A pagar" value="R$ 9.870" change="3,1%" icon={FileText} />
            <Metric title="Saldo projetado" value="R$ 54.390" change="15,4%" positive icon={CircleDollarSign} />
          </section>

          <section className="main-grid">
            <article className="panel cash-panel">
              <div className="panel-title"><div><h2>Fluxo financeiro</h2><p>Entradas e saídas nos últimos seis meses</p></div><span className="healthy"><i /> Caixa saudável</span></div>
              <div className="chart" aria-label="Gráfico demonstrativo de fluxo financeiro">
                {[42, 58, 47, 69, 63, 82].map((height, index) => (
                  <div className="bar-group" key={index}><div className="bar income" style={{ height: `${height}%` }} /><div className="bar outcome" style={{ height: `${Math.max(24, height - 19)}%` }} /></div>
                ))}
                <div className="chart-line line-one" /><div className="chart-line line-two" /><div className="chart-line line-three" />
              </div>
              <div className="months"><span>Abr</span><span>Mai</span><span>Jun</span><span>Jul</span><span>Ago</span><span>Set</span></div>
              <div className="legend"><span><i className="income-dot" /> Entradas: R$ 61.320</span><span><i className="outcome-dot" /> Saídas: R$ 38.640</span></div>
            </article>

            <article className="panel alerts-panel">
              <div className="panel-title"><div><h2>Atenção necessária</h2><p>Pendências que precisam de ação</p></div></div>
              <Alert icon={Boxes} title="Estoque baixo" detail="6 produtos abaixo do mínimo" tone="amber" />
              <Alert icon={FileText} title="Contas vencendo" detail="4 contas vencem nos próximos 3 dias" tone="rose" />
              <Alert icon={FileCheck2} title="XML para conferir" detail="3 notas aguardam confirmação" tone="blue" />
              <button className="text-button">Ver todas as pendências <ArrowUpRight size={16} /></button>
            </article>
          </section>

          <section className="section-title"><div><h2>Acesso rápido</h2><p>Entre nos principais módulos do sistema</p></div></section>
          <section className="modules-grid">
            {modules.map(({ title, detail, icon: Icon, tone }) => (
              <button className="module-card" key={title} onClick={() => selectSection(title === 'Fiscal e XML' ? 'Documentos fiscais' : title)}>
                <span className={`module-icon ${tone}`}><Icon size={22} /></span><span><strong>{title}</strong><small>{detail}</small></span><ArrowUpRight size={18} />
              </button>
            ))}
          </section>

          <article className="panel activity-panel">
            <div className="panel-title"><div><h2>Atividade recente</h2><p>Últimas movimentações registradas</p></div><button className="filter-button">Todas as atividades <ChevronDown size={15} /></button></div>
            <div className="activity-list">
              {activities.map((item) => <div className="activity" key={item.title}><span className="activity-icon"><PackageCheck size={19} /></span><div><strong>{item.title}</strong><small>{item.meta}</small></div><b className={item.kind}>{item.value}</b></div>)}
            </div>
          </article>
        </>
}

function Metric({ title, value, change, positive = false, icon: Icon }: { title: string; value: string; change: string; positive?: boolean; icon: ComponentType<{ size?: number }> }) {
  return <article className="metric-card"><div className="metric-top"><span>{title}</span><Icon size={21} /></div><strong>{value}</strong><div className={positive ? 'trend positive' : 'trend negative'}>{positive ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />} {change}<span> vs. mês anterior</span></div></article>
}

function Alert({ icon: Icon, title, detail, tone }: { icon: ComponentType<{ size?: number }>; title: string; detail: string; tone: string }) {
  return <button className="alert-row"><span className={`alert-icon ${tone}`}><Icon size={19} /></span><span><strong>{title}</strong><small>{detail}</small></span><ArrowUpRight size={17} /></button>
}

export default App
