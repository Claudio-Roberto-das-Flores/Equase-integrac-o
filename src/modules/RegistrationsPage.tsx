import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Building2, Package, Plus, Search, Users, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

type PartnerKind = 'customer' | 'supplier' | 'both'
type RegistrationTab = 'customers' | 'suppliers' | 'products'

type Partner = {
  id: string
  kind: PartnerKind
  name: string
  document: string | null
  email: string | null
  phone: string | null
  city: string | null
  state: string | null
  status: 'active' | 'inactive'
}

type Product = {
  id: string
  sku: string
  name: string
  kind: 'product' | 'service'
  unit: string
  sale_price: number
  cost_price: number
  minimum_stock: number
  status: 'active' | 'inactive'
}

export default function RegistrationsPage({ companyId }: { companyId: string }) {
  const [tab, setTab] = useState<RegistrationTab>('customers')
  const [partners, setPartners] = useState<Partner[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  const loadData = async () => {
    if (!supabase) return
    setLoading(true)
    setError('')
    const [{ data: partnerRows, error: partnerError }, { data: productRows, error: productError }] = await Promise.all([
      supabase.from('business_partners').select('id, kind, name, document, email, phone, city, state, status').eq('company_id', companyId).order('name'),
      supabase.from('products').select('id, sku, name, kind, unit, sale_price, cost_price, minimum_stock, status').eq('company_id', companyId).order('name'),
    ])
    if (partnerError || productError) setError(partnerError?.message || productError?.message || 'Não foi possível carregar os cadastros.')
    setPartners((partnerRows || []) as Partner[])
    setProducts((productRows || []) as Product[])
    setLoading(false)
  }

  useEffect(() => { void loadData() }, [companyId])

  const visiblePartners = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    return partners.filter((partner) => {
      const correctKind = tab === 'customers'
        ? partner.kind === 'customer' || partner.kind === 'both'
        : partner.kind === 'supplier' || partner.kind === 'both'
      return correctKind && (!term || [partner.name, partner.document, partner.email].some((value) => value?.toLocaleLowerCase('pt-BR').includes(term)))
    })
  }, [partners, search, tab])

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    return products.filter((product) => !term || [product.name, product.sku].some((value) => value.toLocaleLowerCase('pt-BR').includes(term)))
  }, [products, search])

  const total = tab === 'products' ? visibleProducts.length : visiblePartners.length

  return (
    <section className="registrations-page">
      <div className="registrations-toolbar">
        <div>
          <h2>Cadastros da empresa</h2>
          <p>Clientes, fornecedores, produtos e serviços usados nos demais módulos.</p>
        </div>
        <button className="primary-action" onClick={() => setFormOpen(true)}><Plus size={17} /> Novo cadastro</button>
      </div>

      <div className="registration-tabs" role="tablist">
        <TabButton active={tab === 'customers'} icon={Users} label="Clientes" count={partners.filter((item) => item.kind !== 'supplier').length} onClick={() => { setTab('customers'); setSearch('') }} />
        <TabButton active={tab === 'suppliers'} icon={Building2} label="Fornecedores" count={partners.filter((item) => item.kind !== 'customer').length} onClick={() => { setTab('suppliers'); setSearch('') }} />
        <TabButton active={tab === 'products'} icon={Package} label="Produtos e serviços" count={products.length} onClick={() => { setTab('products'); setSearch('') }} />
      </div>

      <article className="panel registration-panel">
        <div className="list-toolbar">
          <div className="registration-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Buscar ${tab === 'products' ? 'produto ou SKU' : 'nome, documento ou e-mail'}...`} /></div>
          <span>{total} {total === 1 ? 'registro' : 'registros'}</span>
        </div>

        {error && <div className="form-message error">{error}</div>}
        {loading ? <div className="empty-state">Carregando cadastros...</div> : tab === 'products' ? (
          <ProductTable products={visibleProducts} />
        ) : (
          <PartnerTable partners={visiblePartners} />
        )}
      </article>

      {formOpen && (
        <RegistrationForm
          tab={tab}
          companyId={companyId}
          onClose={() => setFormOpen(false)}
          onSaved={async () => { setFormOpen(false); await loadData() }}
        />
      )}
    </section>
  )
}

function TabButton({ active, icon: Icon, label, count, onClick }: { active: boolean; icon: typeof Users; label: string; count: number; onClick: () => void }) {
  return <button className={active ? 'active' : ''} onClick={onClick} role="tab" aria-selected={active}><Icon size={18} /><span>{label}</span><b>{count}</b></button>
}

function PartnerTable({ partners }: { partners: Partner[] }) {
  if (!partners.length) return <EmptyState text="Nenhum cadastro encontrado." />
  return <div className="data-table"><div className="table-head"><span>Nome</span><span>Documento</span><span>Contato</span><span>Cidade</span><span>Status</span></div>{partners.map((partner) => <div className="table-row" key={partner.id}><span data-label="Nome"><strong>{partner.name}</strong><small>{partner.kind === 'both' ? 'Cliente e fornecedor' : partner.kind === 'customer' ? 'Cliente' : 'Fornecedor'}</small></span><span data-label="Documento">{partner.document || '—'}</span><span data-label="Contato">{partner.email || partner.phone || '—'}</span><span data-label="Cidade">{[partner.city, partner.state].filter(Boolean).join(' / ') || '—'}</span><span data-label="Status"><i className={`status-pill ${partner.status}`}>{partner.status === 'active' ? 'Ativo' : 'Inativo'}</i></span></div>)}</div>
}

function ProductTable({ products }: { products: Product[] }) {
  if (!products.length) return <EmptyState text="Nenhum produto ou serviço cadastrado." />
  const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
  return <div className="data-table products-table"><div className="table-head"><span>Produto/serviço</span><span>SKU</span><span>Unidade</span><span>Custo</span><span>Venda</span></div>{products.map((product) => <div className="table-row" key={product.id}><span data-label="Produto/serviço"><strong>{product.name}</strong><small>{product.kind === 'service' ? 'Serviço' : 'Produto'}</small></span><span data-label="SKU">{product.sku}</span><span data-label="Unidade">{product.unit}</span><span data-label="Custo">{money.format(product.cost_price)}</span><span data-label="Venda"><strong>{money.format(product.sale_price)}</strong></span></div>)}</div>
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state"><Package size={32} /><strong>{text}</strong><span>Clique em “Novo cadastro” para adicionar o primeiro.</span></div>
}

function RegistrationForm({ tab, companyId, onClose, onSaved }: { tab: RegistrationTab; companyId: string; onClose: () => void; onSaved: () => Promise<void> }) {
  const isProduct = tab === 'products'
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) return
    setSaving(true)
    setError('')
    const values = new FormData(event.currentTarget)
    const result = isProduct
      ? await supabase.from('products').insert({
          company_id: companyId,
          sku: String(values.get('sku') || '').trim(),
          name: String(values.get('name') || '').trim(),
          kind: values.get('product_kind'),
          unit: String(values.get('unit') || 'UN').trim().toUpperCase(),
          cost_price: Number(values.get('cost_price') || 0),
          sale_price: Number(values.get('sale_price') || 0),
          minimum_stock: Number(values.get('minimum_stock') || 0),
        })
      : await supabase.from('business_partners').insert({
          company_id: companyId,
          kind: values.get('partner_kind'),
          name: String(values.get('name') || '').trim(),
          legal_name: String(values.get('legal_name') || '').trim() || null,
          document: String(values.get('document') || '').replace(/\D/g, '') || null,
          email: String(values.get('email') || '').trim() || null,
          phone: String(values.get('phone') || '').trim() || null,
          city: String(values.get('city') || '').trim() || null,
          state: String(values.get('state') || '').trim().toUpperCase() || null,
        })
    if (result.error) {
      setError(result.error.code === '23505' ? 'Já existe um cadastro com esse documento ou código.' : result.error.message)
      setSaving(false)
      return
    }
    await onSaved()
  }

  return <div className="modal-backdrop" role="presentation"><div className="registration-modal" role="dialog" aria-modal="true" aria-label="Novo cadastro"><div className="modal-title"><div><span>NOVO CADASTRO</span><h2>{isProduct ? 'Produto ou serviço' : tab === 'customers' ? 'Cliente' : 'Fornecedor'}</h2></div><button onClick={onClose} aria-label="Fechar"><X size={20} /></button></div><form onSubmit={submit}>{isProduct ? <ProductFields /> : <PartnerFields tab={tab} />}{error && <div className="form-message error">{error}</div>}<div className="form-actions"><button type="button" className="secondary-action" onClick={onClose}>Cancelar</button><button className="primary-action" disabled={saving}>{saving ? 'Salvando...' : 'Salvar cadastro'}</button></div></form></div></div>
}

function PartnerFields({ tab }: { tab: RegistrationTab }) {
  return <div className="form-grid"><label className="full">Nome principal*<input name="name" required placeholder="Nome do cliente ou fornecedor" /></label><label className="full">Razão social<input name="legal_name" placeholder="Opcional para pessoa jurídica" /></label><label>Tipo<select name="partner_kind" defaultValue={tab === 'customers' ? 'customer' : 'supplier'}><option value="customer">Cliente</option><option value="supplier">Fornecedor</option><option value="both">Cliente e fornecedor</option></select></label><label>CPF ou CNPJ<input name="document" inputMode="numeric" placeholder="Somente números" /></label><label>E-mail<input name="email" type="email" placeholder="contato@empresa.com.br" /></label><label>Telefone<input name="phone" placeholder="(00) 00000-0000" /></label><label>Cidade<input name="city" /></label><label>UF<input name="state" maxLength={2} placeholder="RJ" /></label></div>
}

function ProductFields() {
  return <div className="form-grid"><label className="full">Nome*<input name="name" required placeholder="Nome do produto ou serviço" /></label><label>SKU/Código*<input name="sku" required placeholder="Ex.: PROD-001" /></label><label>Tipo<select name="product_kind" defaultValue="product"><option value="product">Produto</option><option value="service">Serviço</option></select></label><label>Unidade<input name="unit" defaultValue="UN" maxLength={6} /></label><label>Estoque mínimo<input name="minimum_stock" type="number" min="0" step="0.0001" defaultValue="0" /></label><label>Preço de custo<input name="cost_price" type="number" min="0" step="0.01" defaultValue="0" /></label><label>Preço de venda<input name="sale_price" type="number" min="0" step="0.01" defaultValue="0" /></label></div>
}
