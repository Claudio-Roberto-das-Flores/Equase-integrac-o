import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Boxes, Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

type StockProduct = {
  id: string
  sku: string
  name: string
  unit: string
  minimum_stock: number
  cost_price: number
  quantity: number
  reserved_quantity: number
}

type MovementMode = 'in' | 'out' | 'adjustment'

export default function InventoryPage({ companyId }: { companyId: string }) {
  const [products, setProducts] = useState<StockProduct[]>([])
  const [warehouseId, setWarehouseId] = useState('')
  const [search, setSearch] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [movementOpen, setMovementOpen] = useState(false)

  const loadInventory = async () => {
    if (!supabase) return
    setLoading(true)
    setError('')
    const { data: warehouse, error: warehouseError } = await supabase
      .from('warehouses').select('id').eq('company_id', companyId).eq('is_default', true).maybeSingle()
    if (warehouseError || !warehouse) {
      setError(warehouseError?.message || 'Estoque principal não encontrado.')
      setLoading(false)
      return
    }
    setWarehouseId(warehouse.id)
    const [{ data: productRows, error: productError }, { data: balanceRows, error: balanceError }] = await Promise.all([
      supabase.from('products').select('id, sku, name, unit, minimum_stock, cost_price').eq('company_id', companyId).eq('kind', 'product').eq('status', 'active').order('name'),
      supabase.from('inventory_balances').select('product_id, quantity, reserved_quantity').eq('company_id', companyId).eq('warehouse_id', warehouse.id),
    ])
    if (productError || balanceError) setError(productError?.message || balanceError?.message || 'Não foi possível carregar o estoque.')
    const balanceMap = new Map((balanceRows || []).map((row) => [row.product_id, row]))
    setProducts((productRows || []).map((product) => {
      const balance = balanceMap.get(product.id)
      return { ...product, quantity: Number(balance?.quantity || 0), reserved_quantity: Number(balance?.reserved_quantity || 0) }
    }))
    setLoading(false)
  }

  useEffect(() => { void loadInventory() }, [companyId])

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    return products.filter((product) => {
      const matches = !term || product.name.toLocaleLowerCase('pt-BR').includes(term) || product.sku.toLocaleLowerCase('pt-BR').includes(term)
      return matches && (!lowOnly || product.quantity <= product.minimum_stock)
    })
  }, [products, search, lowOnly])

  const totals = useMemo(() => ({
    items: products.length,
    units: products.reduce((sum, item) => sum + item.quantity, 0),
    low: products.filter((item) => item.quantity <= item.minimum_stock).length,
    value: products.reduce((sum, item) => sum + item.quantity * item.cost_price, 0),
  }), [products])

  const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

  return <section className="inventory-page">
    <div className="inventory-summary">
      <SummaryCard label="Produtos cadastrados" value={String(totals.items)} icon={Boxes} />
      <SummaryCard label="Unidades disponíveis" value={formatQuantity(totals.units)} icon={ArrowDownToLine} />
      <SummaryCard label="Estoque baixo" value={String(totals.low)} icon={AlertTriangle} warning />
      <SummaryCard label="Valor em estoque" value={money.format(totals.value)} icon={ArrowUpFromLine} />
    </div>

    <article className="panel inventory-panel">
      <div className="inventory-toolbar">
        <div><h2>Saldo de estoque</h2><p>Posição atual do estoque principal.</p></div>
        <button className="primary-action" disabled={!products.length} onClick={() => setMovementOpen(true)}><Plus size={17} /> Novo movimento</button>
      </div>
      <div className="inventory-filters">
        <div className="registration-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar produto ou SKU..." /></div>
        <button className={lowOnly ? 'filter-toggle active' : 'filter-toggle'} onClick={() => setLowOnly((current) => !current)}><SlidersHorizontal size={15} /> Somente estoque baixo</button>
      </div>
      {error && <div className="form-message error">{error}</div>}
      {loading ? <div className="empty-state">Carregando estoque...</div> : !products.length ? <div className="empty-state"><Boxes size={32} /><strong>Nenhum produto cadastrado.</strong><span>Cadastre um produto antes de movimentar o estoque.</span></div> : (
        <div className="inventory-table">
          <div className="inventory-head"><span>Produto</span><span>Disponível</span><span>Reservado</span><span>Mínimo</span><span>Situação</span></div>
          {visibleProducts.map((product) => {
            const low = product.quantity <= product.minimum_stock
            return <div className="inventory-row" key={product.id}><span data-label="Produto"><strong>{product.name}</strong><small>{product.sku} · {product.unit}</small></span><span data-label="Disponível"><b>{formatQuantity(product.quantity)}</b></span><span data-label="Reservado">{formatQuantity(product.reserved_quantity)}</span><span data-label="Mínimo">{formatQuantity(product.minimum_stock)}</span><span data-label="Situação"><i className={`stock-status ${low ? 'low' : 'ok'}`}>{low ? 'Estoque baixo' : 'Normal'}</i></span></div>
          })}
          {!visibleProducts.length && <div className="empty-state">Nenhum produto corresponde aos filtros.</div>}
        </div>
      )}
    </article>

    {movementOpen && <MovementForm companyId={companyId} warehouseId={warehouseId} products={products} onClose={() => setMovementOpen(false)} onSaved={async () => { setMovementOpen(false); await loadInventory() }} />}
  </section>
}

function SummaryCard({ label, value, icon: Icon, warning = false }: { label: string; value: string; icon: typeof Boxes; warning?: boolean }) {
  return <article className={`inventory-summary-card ${warning ? 'warning' : ''}`}><span><Icon size={20} /></span><div><small>{label}</small><strong>{value}</strong></div></article>
}

function MovementForm({ companyId, warehouseId, products, onClose, onSaved }: { companyId: string; warehouseId: string; products: StockProduct[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const [mode, setMode] = useState<MovementMode>('in')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) return
    setSaving(true)
    setError('')
    const values = new FormData(event.currentTarget)
    const productId = String(values.get('product_id'))
    const informedQuantity = Number(values.get('quantity'))
    const product = products.find((item) => item.id === productId)
    if (!product || !informedQuantity || informedQuantity < 0) {
      setError('Selecione o produto e informe uma quantidade válida.')
      setSaving(false)
      return
    }
    const nextQuantity = mode === 'in' ? product.quantity + informedQuantity : mode === 'out' ? product.quantity - informedQuantity : informedQuantity
    if (nextQuantity < 0) {
      setError(`A saída é maior que o saldo disponível de ${formatQuantity(product.quantity)}.`)
      setSaving(false)
      return
    }
    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) {
      setError('Sessão expirada. Entre novamente no aplicativo.')
      setSaving(false)
      return
    }
    const { error: balanceError } = await supabase.from('inventory_balances').upsert({
      company_id: companyId,
      warehouse_id: warehouseId,
      product_id: productId,
      quantity: nextQuantity,
      reserved_quantity: product.reserved_quantity,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'warehouse_id,product_id' })
    if (balanceError) {
      setError(balanceError.message)
      setSaving(false)
      return
    }
    const movementQuantity = mode === 'adjustment' ? Math.max(Math.abs(nextQuantity - product.quantity), 0.0001) : informedQuantity
    const { error: movementError } = await supabase.from('inventory_movements').insert({
      company_id: companyId,
      warehouse_id: warehouseId,
      product_id: productId,
      movement_type: mode,
      quantity: movementQuantity,
      unit_cost: product.cost_price,
      source_type: 'manual',
      notes: String(values.get('notes') || '').trim() || null,
      created_by: authData.user.id,
    })
    if (movementError) setError(`Saldo atualizado, mas o histórico não foi registrado: ${movementError.message}`)
    await onSaved()
  }

  return <div className="modal-backdrop"><div className="registration-modal"><div className="modal-title"><div><span>MOVIMENTAÇÃO MANUAL</span><h2>Atualizar estoque</h2></div><button onClick={onClose} aria-label="Fechar"><X size={20} /></button></div><form onSubmit={submit}><div className="movement-types"><button type="button" className={mode === 'in' ? 'active' : ''} onClick={() => setMode('in')}><ArrowDownToLine size={17} /> Entrada</button><button type="button" className={mode === 'out' ? 'active' : ''} onClick={() => setMode('out')}><ArrowUpFromLine size={17} /> Saída</button><button type="button" className={mode === 'adjustment' ? 'active' : ''} onClick={() => setMode('adjustment')}><SlidersHorizontal size={17} /> Ajuste</button></div><div className="form-grid"><label className="full">Produto*<select name="product_id" required defaultValue=""><option value="" disabled>Selecione um produto</option>{products.map((product) => <option value={product.id} key={product.id}>{product.name} — saldo {formatQuantity(product.quantity)}</option>)}</select></label><label className="full">{mode === 'adjustment' ? 'Novo saldo*' : 'Quantidade*'}<input name="quantity" required type="number" min="0.0001" step="0.0001" /></label><label className="full">Observação<input name="notes" placeholder="Motivo ou referência do movimento" /></label></div>{error && <div className="form-message error">{error}</div>}<div className="form-actions"><button type="button" className="secondary-action" onClick={onClose}>Cancelar</button><button className="primary-action" disabled={saving}>{saving ? 'Salvando...' : 'Confirmar movimento'}</button></div></form></div></div>
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 }).format(value)
}
