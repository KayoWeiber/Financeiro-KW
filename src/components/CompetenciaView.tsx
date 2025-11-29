import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BarChart3, CreditCard, PieChart, Wallet, TrendingUp, Pencil, Trash2, X, Check } from 'lucide-react'
import { Pie, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)
import { api } from '../lib/api'

const palette = {
  primary: '#0038A8',
  secondary: '#FF8800',
  background: '#F5F5F5',
  contrast: '#333333',
  success: '#2ECC71',
  error: '#E74C3C'
}

const StatCard = ({ icon, title, value, accent }: { icon: React.ReactNode; title: string; value: string; accent?: string }) => (
  <div className="rounded-2xl p-4 shadow-sm border border-black/10 bg-white flex items-center gap-3">
    <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: accent || '#F0F4FF' }}>
      {icon}
    </div>
    <div>
      <div className="text-xs opacity-70">{title}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  </div>
)

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-2xl p-6 shadow-sm border border-black/10 bg-white">
    <h2 className="text-xl font-semibold mb-4">{title}</h2>
    {children}
  </section>
)

type Competencia = { id: string; ano: number; mes: number; ativa?: boolean }
type Entrada = { id: string; data: string; tipo_renda: string; descricao: string; valor: number }
type Investimento = { id: string; data: string; descricao: string; valor: number }
type GastoFixo = { id: string; categoria_id: string; data: string; descricao: string; forma_pagamento_id: string; pago: boolean; valor: number }
type GastoVariavel = { id: string; categoria_id: string; data: string; descricao: string; forma_pagamento_id: string; valor: number }
type Categoria = { id: string; nome: string }
type FormaPagamento = { id: string; tipo: string }

const mesesPt = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const CompetenciaView: React.FC = () => {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [competenciaAtual, setCompetenciaAtual] = useState<Competencia | null>(null)
  const [entradas, setEntradas] = useState<Entrada[]>([])
  const [investimentos, setInvestimentos] = useState<Investimento[]>([])
  const [gastosFixos, setGastosFixos] = useState<GastoFixo[]>([])
  const [gastosVariaveis, setGastosVariaveis] = useState<GastoVariavel[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([])

  // Form states
  const [formEntrada, setFormEntrada] = useState({ data: new Date().toISOString().slice(0,10), tipo_renda: 'Renda fixa', descricao: '', valor: '' })
  const [formInvest, setFormInvest] = useState({ data: new Date().toISOString().slice(0,10), descricao: '', valor: '' })
  const [formFixos, setFormFixos] = useState({ categoria_id: '', data: new Date().toISOString().slice(0,10), descricao: '', forma_pagamento_id: '', pago: false, valor: '' })
  const [formVar, setFormVar] = useState({ categoria_id: '', data: new Date().toISOString().slice(0,10), descricao: '', forma_pagamento_id: '', valor: '' })
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [editingEntrada, setEditingEntrada] = useState<string | null>(null)
  const [editingInvest, setEditingInvest] = useState<string | null>(null)
  const [editingFixo, setEditingFixo] = useState<string | null>(null)
  const [editingVar, setEditingVar] = useState<string | null>(null)
  // Editing temp states
  const [editEntradaValues, setEditEntradaValues] = useState({ data:'', tipo_renda:'', descricao:'', valor:'' })
  const [editInvestValues, setEditInvestValues] = useState({ data:'', descricao:'', valor:'' })
  const [editFixoValues, setEditFixoValues] = useState({ categoria_id:'', data:'', descricao:'', forma_pagamento_id:'', pago:false, valor:'' })
  const [editVarValues, setEditVarValues] = useState({ categoria_id:'', data:'', descricao:'', forma_pagamento_id:'', valor:'' })

  useEffect(() => {
    const fetchCompetencia = async () => {
      try {
        setLoading(true)
        setError(null)
        let userId: string | null = localStorage.getItem('kw_uid')
        if (!userId) userId = localStorage.getItem('kw_user_id')
        if (!userId) throw new Error('Usuário não identificado')
        const data = await api.getCompetencias(userId)
        const list: Competencia[] = Array.isArray(data) ? (data as Competencia[]) : []
        const found = list.find(c => String(c.id) === String(id)) || null
        setCompetenciaAtual(found)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Falha ao carregar competência'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    fetchCompetencia()
  }, [id])

  // Fetch related data when competencia resolves
  useEffect(() => {
    const loadAll = async () => {
      if (!competenciaAtual) return
      let userId: string | null = localStorage.getItem('kw_uid')
      if (!userId) userId = localStorage.getItem('kw_user_id')
      if (!userId) return
      try {
        const [entr, inv, gf, gv, cats, formas] = await Promise.all([
          api.getEntradas(competenciaAtual.id),
          api.getInvestimentos(competenciaAtual.id),
          api.getGastosFixos(competenciaAtual.id).catch(() => []),
          api.getGastosVariaveis(competenciaAtual.id),
          api.getCategorias(userId),
          api.getFormasPagamento(userId)
        ])
        setEntradas(Array.isArray(entr) ? entr as Entrada[] : [])
        setInvestimentos(Array.isArray(inv) ? inv as Investimento[] : [])
        setGastosFixos(Array.isArray(gf) ? gf as GastoFixo[] : [])
        setGastosVariaveis(Array.isArray(gv) ? gv as GastoVariavel[] : [])
        setCategorias(Array.isArray(cats) ? cats as Categoria[] : [])
        setFormasPagamento(Array.isArray(formas) ? formas as FormaPagamento[] : [])
      } catch {
        // silencioso
      }
    }
    loadAll()
  }, [competenciaAtual])

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR',{ style:'currency', currency:'BRL'}).format(v || 0)

  const totalEntradas = entradas.reduce((s,e)=> s + (e.valor||0),0)
  const totalInvestido = investimentos.reduce((s,i)=> s + (i.valor||0),0)
  const totalGastosFixos = gastosFixos.reduce((s,g)=> s + (g.valor||0),0)
  const totalGastosVariaveis = gastosVariaveis.reduce((s,g)=> s + (g.valor||0),0)
  const totalDespesas = totalGastosFixos + totalGastosVariaveis
  const saldo = totalEntradas - totalDespesas - totalInvestido

  // Aggregations for charts
  const gastosPorCategoria = useMemo(() => {
    const map: Record<string, number> = {}
    ;[...gastosFixos, ...gastosVariaveis].forEach(g => {
      const nome = categorias.find(c=>c.id===g.categoria_id)?.nome || 'Outros'
      map[nome] = (map[nome]||0) + g.valor
    })
    return map
  }, [gastosFixos, gastosVariaveis, categorias])

  const gastosPorPagamento = useMemo(() => {
    const map: Record<string, number> = {}
    ;[...gastosFixos, ...gastosVariaveis].forEach(g => {
      const tipo = formasPagamento.find(f=>f.id===g.forma_pagamento_id)?.tipo || 'Outro'
      map[tipo] = (map[tipo]||0) + g.valor
    })
    return map
  }, [gastosFixos, gastosVariaveis, formasPagamento])

  const pieData = {
    labels: Object.keys(gastosPorCategoria),
    datasets: [
      {
        data: Object.values(gastosPorCategoria),
        backgroundColor: ['#0038A8','#FF8800','#2ECC71','#E74C3C','#8E44AD','#16A085','#F1C40F','#D35400'],
        borderWidth: 0
      }
    ]
  }
  const barData = {
    labels: Object.keys(gastosPorPagamento),
    datasets: [
      {
        label: 'Gastos',
        data: Object.values(gastosPorPagamento),
        backgroundColor: '#0038A8'
      }
    ]
  }

  // Date helpers
  const formatDateDisplay = (raw: string) => {
    if (!raw) return '—'
    try {
      const d = new Date(raw)
      if (isNaN(d.getTime())) return raw.slice(0,10)
      return d.toLocaleDateString('pt-BR') // dd/MM/aaaa
    } catch { return raw.slice(0,10) }
  }
  const isoInput = (raw: string) => {
    if (!raw) return ''
    // If already yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
    try {
      const d = new Date(raw)
      if (isNaN(d.getTime())) return raw.slice(0,10)
      return d.toISOString().slice(0,10)
    } catch { return raw.slice(0,10) }
  }

  const handleSubmitEntrada = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!competenciaAtual) return
    let userId: string | null = localStorage.getItem('kw_uid')
    if (!userId) userId = localStorage.getItem('kw_user_id')
    if (!userId) return
    try {
      setSubmitting('entrada')
      const payload = {
        user_id: userId,
        competencia_id: competenciaAtual.id,
        data: formEntrada.data,
        tipo_renda: formEntrada.tipo_renda,
        descricao: formEntrada.descricao,
        valor: Number(formEntrada.valor) || 0
      }
      const created = await api.createEntrada(payload) as Entrada
      setEntradas(prev => [...prev, created])
      setFormEntrada({ data: formEntrada.data, tipo_renda: formEntrada.tipo_renda, descricao: '', valor: '' })
    } finally { setSubmitting(null) }
  }

  const handleSubmitInvest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!competenciaAtual) return
    let userId: string | null = localStorage.getItem('kw_uid')
    if (!userId) userId = localStorage.getItem('kw_user_id')
    if (!userId) return
    const valorNum = Number(formInvest.valor)||0
    if (valorNum > saldo) {
      alert('Investimento maior que saldo disponível.')
      return
    }
    try {
      setSubmitting('invest')
      const payload = { user_id: userId, competencia_id: competenciaAtual.id, data: formInvest.data, descricao: formInvest.descricao, valor: valorNum }
      const created = await api.createInvestimento(payload) as Investimento
      setInvestimentos(prev => [...prev, created])
      setFormInvest({ data: formInvest.data, descricao: '', valor: '' })
    } finally { setSubmitting(null) }
  }
  // Generic helpers
  const startEditEntrada = (e: Entrada) => { setEditingEntrada(e.id); setEditEntradaValues({ data: isoInput(e.data), tipo_renda:e.tipo_renda, descricao:e.descricao, valor:String(e.valor) }) }
  const startEditInvest = (i: Investimento) => { setEditingInvest(i.id); setEditInvestValues({ data: isoInput(i.data), descricao:i.descricao, valor:String(i.valor) }) }
  const startEditFixo = (g: GastoFixo) => { setEditingFixo(g.id); setEditFixoValues({ categoria_id:g.categoria_id, data: isoInput(g.data), descricao:g.descricao, forma_pagamento_id:g.forma_pagamento_id, pago:g.pago, valor:String(g.valor) }) }
  const startEditVar = (g: GastoVariavel) => { setEditingVar(g.id); setEditVarValues({ categoria_id:g.categoria_id, data: isoInput(g.data), descricao:g.descricao, forma_pagamento_id:g.forma_pagamento_id, valor:String(g.valor) }) }

  const cancelAll = () => { setEditingEntrada(null); setEditingInvest(null); setEditingFixo(null); setEditingVar(null) }

  const saveEntrada = async (entry: Entrada) => {
    try {
      setSubmitting('edit-entrada')
      const diffs: Array<Promise<unknown>> = []
      if (editEntradaValues.data && editEntradaValues.data !== entry.data) {
        diffs.push(api.updateEntrada(entry.id, 'data', editEntradaValues.data))
      }
      if (editEntradaValues.tipo_renda && editEntradaValues.tipo_renda !== entry.tipo_renda) {
        diffs.push(api.updateEntrada(entry.id, 'tipo_renda', editEntradaValues.tipo_renda))
      }
      if (editEntradaValues.descricao !== entry.descricao) {
        diffs.push(api.updateEntrada(entry.id, 'descricao', editEntradaValues.descricao))
      }
      const valorNum = Number(editEntradaValues.valor)||0
      if (valorNum !== entry.valor) {
        diffs.push(api.updateEntrada(entry.id, 'valor', valorNum))
      }
      if (diffs.length) await Promise.all(diffs)
      setEntradas(prev => prev.map(e=> e.id===entry.id ? { ...e, data: editEntradaValues.data, tipo_renda: editEntradaValues.tipo_renda, descricao: editEntradaValues.descricao, valor: valorNum } : e))
      setEditingEntrada(null)
    } finally { setSubmitting(null) }
  }
  const deleteEntrada = async (id:string) => {
    if (!confirm('Remover entrada?')) return
    await api.deleteEntrada(id)
    setEntradas(prev => prev.filter(e=> e.id!==id))
  }

  const saveInvest = async (id:string) => {
    try {
      setSubmitting('edit-invest')
      const payload = { data: editInvestValues.data, descricao: editInvestValues.descricao, valor: Number(editInvestValues.valor)||0 }
      if ((Number(editInvestValues.valor)||0) > saldo) { alert('Investimento maior que saldo.'); return }
      await api.updateInvestimento(id, payload)
      setInvestimentos(prev => prev.map(i=> i.id===id ? { ...i, ...payload } : i))
      setEditingInvest(null)
    } finally { setSubmitting(null) }
  }
  const deleteInvest = async (id:string) => {
    if (!confirm('Remover investimento?')) return
    await api.deleteInvestimento(id)
    setInvestimentos(prev => prev.filter(i=> i.id!==id))
  }

  const saveFixo = async (gasto: GastoFixo) => {
    try {
      setSubmitting('edit-fixo')
      const diffs: Array<Promise<unknown>> = []
      if (editFixoValues.data && editFixoValues.data !== gasto.data) diffs.push(api.updateGastoFixo(gasto.id, 'data', editFixoValues.data))
      if (editFixoValues.descricao !== gasto.descricao) diffs.push(api.updateGastoFixo(gasto.id, 'descricao', editFixoValues.descricao))
      const valorNum = Number(editFixoValues.valor)||0
      if (valorNum !== gasto.valor) diffs.push(api.updateGastoFixo(gasto.id, 'valor', valorNum))
      if (editFixoValues.pago !== gasto.pago) diffs.push(api.updateGastoFixo(gasto.id, 'pago', editFixoValues.pago))
      if (editFixoValues.categoria_id !== gasto.categoria_id) diffs.push(api.updateGastoFixo(gasto.id, 'categoria_id', editFixoValues.categoria_id))
      if (editFixoValues.forma_pagamento_id !== gasto.forma_pagamento_id) diffs.push(api.updateGastoFixo(gasto.id, 'forma_pagamento_id', editFixoValues.forma_pagamento_id))
      if (diffs.length) await Promise.all(diffs)
      setGastosFixos(prev => prev.map(g=> g.id===gasto.id ? { ...g, data: editFixoValues.data, descricao: editFixoValues.descricao, valor: valorNum, pago: editFixoValues.pago, categoria_id: editFixoValues.categoria_id, forma_pagamento_id: editFixoValues.forma_pagamento_id } : g))
      setEditingFixo(null)
    } finally { setSubmitting(null) }
  }
  const deleteFixo = async (id:string) => {
    if (!confirm('Remover gasto fixo?')) return
    await api.deleteGastoFixo(id)
    setGastosFixos(prev => prev.filter(g=> g.id!==id))
  }

  const saveVar = async (id:string) => {
    try {
      setSubmitting('edit-var')
      const payload = { data: editVarValues.data, descricao: editVarValues.descricao, valor: Number(editVarValues.valor)||0, categoria_id: editVarValues.categoria_id, forma_pagamento_id: editVarValues.forma_pagamento_id }
      await api.updateGastoVariavel(id, { data: payload.data, descricao: payload.descricao, valor: payload.valor })
      setGastosVariaveis(prev => prev.map(g=> g.id===id ? { ...g, ...payload } : g))
      setEditingVar(null)
    } finally { setSubmitting(null) }
  }
  const deleteVar = async (id:string) => {
    if (!confirm('Remover gasto variável?')) return
    await api.deleteGastoVariavel(id)
    setGastosVariaveis(prev => prev.filter(g=> g.id!==id))
  }

  const handleSubmitFixos = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!competenciaAtual) return
    let userId: string | null = localStorage.getItem('kw_uid')
    if (!userId) userId = localStorage.getItem('kw_user_id')
    if (!userId) return
    if (!formFixos.categoria_id || !formFixos.forma_pagamento_id) return
    try {
      setSubmitting('fixos')
      const payload = {
        user_id: userId,
        competencia_id: competenciaAtual.id,
        categoria_id: formFixos.categoria_id,
        forma_pagamento_id: formFixos.forma_pagamento_id,
        data: formFixos.data,
        descricao: formFixos.descricao,
        valor: Number(formFixos.valor)||0,
        pago: formFixos.pago
      }
      const created = await api.createGastoFixo(payload) as GastoFixo
      setGastosFixos(prev => [...prev, created])
      setFormFixos({ categoria_id: formFixos.categoria_id, forma_pagamento_id: formFixos.forma_pagamento_id, data: formFixos.data, descricao: '', pago: false, valor: '' })
    } finally { setSubmitting(null) }
  }

  const handleSubmitVar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!competenciaAtual) return
    let userId: string | null = localStorage.getItem('kw_uid')
    if (!userId) userId = localStorage.getItem('kw_user_id')
    if (!userId) return
    if (!formVar.categoria_id || !formVar.forma_pagamento_id) return
    try {
      setSubmitting('variaveis')
      const payload = {
        user_id: userId,
        competencia_id: competenciaAtual.id,
        categoria_id: formVar.categoria_id,
        forma_pagamento_id: formVar.forma_pagamento_id,
        data: formVar.data,
        descricao: formVar.descricao,
        valor: Number(formVar.valor)||0
      }
      const created = await api.createGastoVariavel(payload) as GastoVariavel
      setGastosVariaveis(prev => [...prev, created])
      setFormVar({ categoria_id: formVar.categoria_id, forma_pagamento_id: formVar.forma_pagamento_id, data: formVar.data, descricao: '', valor: '' })
    } finally { setSubmitting(null) }
  }

  const tituloMes = useMemo(() => {
    if (!competenciaAtual) return `Resumo do mês · ${id}`
    const nomeMes = mesesPt[(Number(competenciaAtual.mes) - 1 + 12) % 12]
    return `${nomeMes} / ${competenciaAtual.ano}`
  }, [competenciaAtual, id])

  return (
    <div className="min-h-screen px-6 py-8" style={{ background: palette.background, color: palette.contrast }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header>
          <div className="rounded-2xl p-6 text-white shadow-sm" style={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})` }}>
            <div className="flex items-center gap-3">
              <img src="/logo-kw-120.png" alt="Financeiro KW" className="h-10 w-10 rounded-xl bg-white/10 p-1 object-contain" loading="lazy" />
              <div>
                <h1 className="text-2xl font-bold leading-tight">{tituloMes}</h1>
                <p className="text-sm opacity-90">Acompanhe entradas, despesas, investimentos e saldo</p>
              </div>
            </div>
          </div>
        </header>

        {loading && (
          <div className="rounded-2xl p-6 shadow-sm border border-black/10 bg-white">Carregando competência...</div>
        )}
        {error && (
          <div className="rounded-2xl p-6 shadow-sm border border-black/10 bg-white text-red-600">{error}</div>
        )}

        {/* Top summary cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Wallet size={18} color={palette.primary} />} title="Entradas" value={formatCurrency(totalEntradas)} accent={`${palette.primary}1A`} />
          <StatCard icon={<CreditCard size={18} color={palette.error} />} title="Despesas" value={formatCurrency(totalDespesas)} accent={`${palette.error}1A`} />
          <StatCard icon={<TrendingUp size={18} color={palette.secondary} />} title="Investido" value={formatCurrency(totalInvestido)} accent={`${palette.secondary}26`} />
          <StatCard icon={<BarChart3 size={18} color={palette.success} />} title="Saldo" value={formatCurrency(saldo)} accent={`${palette.success}26`} />
        </div>

        {/* Mid summary card */}
        <Section title="Resumo">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-xl p-4 border border-black/10">
              <div className="text-xs opacity-70">Investido</div>
              <div className="text-lg font-semibold">{formatCurrency(totalInvestido)}</div>
            </div>
            <div className="rounded-xl p-4 border border-black/10">
              <div className="text-xs opacity-70">Saídas</div>
              <div className="text-lg font-semibold">{formatCurrency(totalDespesas)}</div>
            </div>
            <div className="rounded-xl p-4 border border-black/10">
              <div className="text-xs opacity-70">Saldo Atual</div>
              <div className="text-lg font-semibold">{formatCurrency(saldo)}</div>
            </div>
          </div>
        </Section>

        {/* Charts */}
        <Section title="Gráficos">
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-black/10 p-4 h-72 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <PieChart size={18} color={palette.secondary} />
                <span className="font-semibold">Gastos por Categoria</span>
              </div>
              {Object.keys(gastosPorCategoria).length === 0 ? (
                <div className="text-xs opacity-70">Sem dados</div>
              ) : (
                <div className="flex-1">
                  <Pie data={pieData} options={{ maintainAspectRatio:false }} />
                </div>
              )}
            </div>
            <div className="rounded-xl border border-black/10 p-4 h-72 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={18} color={palette.primary} />
                <span className="font-semibold">Gastos por Forma de Pagamento</span>
              </div>
              {Object.keys(gastosPorPagamento).length === 0 ? (
                <div className="text-xs opacity-70">Sem dados</div>
              ) : (
                <Bar 
                  data={barData} 
                  options={{
                    responsive:true,
                    maintainAspectRatio:false,
                    plugins:{ legend:{ display:false }},
                    layout:{ padding:{ top:4, right:8, left:8, bottom:4 } },
                    scales:{
                      x:{
                        ticks:{
                          maxRotation:45,
                          minRotation:0,
                          autoSkip:true,
                          // val (tick value) não utilizado; idx para acessar label
                          callback: (_val, idx) => {
                            const label = (barData.labels as string[])[idx] || ''
                            return label.length > 12 ? label.slice(0,10)+'…' : label
                          }
                        }
                      },
                      y:{ beginAtZero:true }
                    },
                    elements:{
                      bar:{ borderRadius:4, borderSkipped:false }
                    }
                  }}
                />
              )}
            </div>
          </div>
        </Section>

        {/* Entradas */}
        <Section title="Entradas">
          <form onSubmit={handleSubmitEntrada} className="grid sm:grid-cols-5 gap-2 mb-4 text-sm">
            <input required type="date" className="rounded-md border px-2 py-1" value={formEntrada.data} onChange={e=>setFormEntrada(f=>({...f,data:e.target.value}))} />
            <select className="rounded-md border px-2 py-1" value={formEntrada.tipo_renda} onChange={e=>setFormEntrada(f=>({...f,tipo_renda:e.target.value}))}>
              <option>Renda fixa</option>
              <option>Renda variável</option>
              <option>Vale</option>
            </select>
            <input required placeholder="Descrição" className="rounded-md border px-2 py-1" value={formEntrada.descricao} onChange={e=>setFormEntrada(f=>({...f,descricao:e.target.value}))} />
            <input required type="number" step="0.01" placeholder="Valor" className="rounded-md border px-2 py-1" value={formEntrada.valor} onChange={e=>setFormEntrada(f=>({...f,valor:e.target.value}))} />
            <button disabled={submitting==='entrada'} className="rounded-md bg-blue-600 text-white text-sm px-3 py-1 disabled:opacity-50">{submitting==='entrada'?'Salvando...':'Adicionar'}</button>
          </form>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Data</th>
                  <th className="p-2">Tipo</th>
                  <th className="p-2">Descrição</th>
                  <th className="p-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                {entradas.map(e=> (
                  editingEntrada===e.id ? (
                    <tr key={e.id} className="border-t bg-blue-50">
                      <td className="p-2"><input type="date" className="border rounded px-1 py-0.5 text-xs" value={editEntradaValues.data} onChange={ev=>setEditEntradaValues(v=>({...v,data:ev.target.value}))} /></td>
                      <td className="p-2"><input className="border rounded px-1 py-0.5 text-xs" value={editEntradaValues.tipo_renda} onChange={ev=>setEditEntradaValues(v=>({...v,tipo_renda:ev.target.value}))} /></td>
                      <td className="p-2"><input className="border rounded px-1 py-0.5 text-xs" value={editEntradaValues.descricao} onChange={ev=>setEditEntradaValues(v=>({...v,descricao:ev.target.value}))} /></td>
                      <td className="p-2 flex items-center gap-2">
                        <input type="number" step="0.01" className="border rounded px-1 py-0.5 text-xs w-24" value={editEntradaValues.valor} onChange={ev=>setEditEntradaValues(v=>({...v,valor:ev.target.value}))} />
                        <button type="button" onClick={()=>saveEntrada(e)} className="text-green-600" title="Salvar"><Check size={16} /></button>
                        <button type="button" onClick={cancelAll} className="text-red-600" title="Cancelar"><X size={16} /></button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={e.id} className="border-t">
                      <td className="p-2">{formatDateDisplay(e.data)}</td>
                      <td className="p-2">{e.tipo_renda}</td>
                      <td className="p-2">{e.descricao}</td>
                      <td className="p-2 flex items-center gap-2">{formatCurrency(e.valor)}
                        <button type="button" onClick={()=> startEditEntrada(e)} className="text-blue-600 cursor-pointer" title="Editar"><Pencil size={14} /></button>
                        <button type="button" onClick={()=> deleteEntrada(e.id)} className="text-red-600 cursor-pointer" title="Remover"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  )
                ))}
                {entradas.length===0 && (
                  <tr><td className="p-2" colSpan={4}>Nenhuma entrada</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Investimentos */}
        <Section title="Investimentos">
          <form onSubmit={handleSubmitInvest} className="grid sm:grid-cols-4 gap-2 mb-4 text-sm">
            <input required type="date" className="rounded-md border px-2 py-1" value={formInvest.data} onChange={e=>setFormInvest(f=>({...f,data:e.target.value}))} />
            <input required placeholder="Descrição" className="rounded-md border px-2 py-1" value={formInvest.descricao} onChange={e=>setFormInvest(f=>({...f,descricao:e.target.value}))} />
            <input required type="number" step="0.01" placeholder="Valor" className="rounded-md border px-2 py-1" value={formInvest.valor} onChange={e=>setFormInvest(f=>({...f,valor:e.target.value}))} />
            <button disabled={submitting==='invest'} className="rounded-md bg-blue-600 text-white text-sm px-3 py-1 disabled:opacity-50">{submitting==='invest'?'Salvando...':'Adicionar'}</button>
          </form>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Data</th>
                  <th className="p-2">Descrição</th>
                  <th className="p-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                {investimentos.map(i=> (
                  editingInvest===i.id ? (
                    <tr key={i.id} className="border-t bg-blue-50">
                      <td className="p-2"><input type="date" className="border rounded px-1 py-0.5 text-xs" value={editInvestValues.data} onChange={ev=>setEditInvestValues(v=>({...v,data:ev.target.value}))} /></td>
                      <td className="p-2"><input className="border rounded px-1 py-0.5 text-xs" value={editInvestValues.descricao} onChange={ev=>setEditInvestValues(v=>({...v,descricao:ev.target.value}))} /></td>
                      <td className="p-2 flex items-center gap-2">
                        <input type="number" step="0.01" className="border rounded px-1 py-0.5 text-xs w-24" value={editInvestValues.valor} onChange={ev=>setEditInvestValues(v=>({...v,valor:ev.target.value}))} />
                        <button type="button" onClick={()=>saveInvest(i.id)} className="text-green-600" title="Salvar"><Check size={16} /></button>
                        <button type="button" onClick={cancelAll} className="text-red-600" title="Cancelar"><X size={16} /></button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={i.id} className="border-t">
                      <td className="p-2">{formatDateDisplay(i.data)}</td>
                      <td className="p-2">{i.descricao}</td>
                      <td className="p-2 flex items-center gap-2">{formatCurrency(i.valor)}
                        <button type="button" onClick={()=> startEditInvest(i)} className="text-blue-600" title="Editar"><Pencil size={14} /></button>
                        <button type="button" onClick={()=> deleteInvest(i.id)} className="text-red-600" title="Remover"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  )
                ))}
                {investimentos.length===0 && (
                  <tr><td className="p-2" colSpan={3}>Nenhum investimento</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Gastos Fixos */}
        <Section title="Gastos Fixos">
          <form onSubmit={handleSubmitFixos} className="grid lg:grid-cols-7 gap-2 mb-4 text-sm">
            <select required className="rounded-md border px-2 py-1" value={formFixos.categoria_id} onChange={e=>setFormFixos(f=>({...f,categoria_id:e.target.value}))}>
              <option value="">Categoria</option>
              {categorias.map(c=> <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            <input required type="date" className="rounded-md border px-2 py-1" value={formFixos.data} onChange={e=>setFormFixos(f=>({...f,data:e.target.value}))} />
            <input required placeholder="Descrição" className="rounded-md border px-2 py-1" value={formFixos.descricao} onChange={e=>setFormFixos(f=>({...f,descricao:e.target.value}))} />
            <select required className="rounded-md border px-2 py-1" value={formFixos.forma_pagamento_id} onChange={e=>setFormFixos(f=>({...f,forma_pagamento_id:e.target.value}))}>
              <option value="">Pagamento</option>
              {formasPagamento.map(f=> <option key={f.id} value={f.id}>{f.tipo}</option>)}
            </select>
            <label className="inline-flex items-center gap-1 text-xs">
              <input type="checkbox" checked={formFixos.pago} onChange={e=>setFormFixos(f=>({...f,pago:e.target.checked}))} /> Pago
            </label>
            <input required type="number" step="0.01" placeholder="Valor" className="rounded-md border px-2 py-1" value={formFixos.valor} onChange={e=>setFormFixos(f=>({...f,valor:e.target.value}))} />
            <button disabled={submitting==='fixos'} className="rounded-md bg-blue-600 text-white text-sm px-3 py-1 disabled:opacity-50">{submitting==='fixos'?'Salvando...':'Adicionar'}</button>
          </form>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Categoria</th>
                  <th className="p-2">Data</th>
                  <th className="p-2">Descrição</th>
                  <th className="p-2">Pagamento</th>
                  <th className="p-2">Pago</th>
                  <th className="p-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                {gastosFixos.map(g=> (
                  editingFixo===g.id ? (
                    <tr key={g.id} className="border-t bg-blue-50">
                      <td className="p-2"><select className="border rounded px-1 py-0.5 text-xs" value={editFixoValues.categoria_id} onChange={ev=>setEditFixoValues(v=>({...v,categoria_id:ev.target.value}))}>{categorias.map(c=> <option key={c.id} value={c.id}>{c.nome}</option>)}</select></td>
                      <td className="p-2"><input type="date" className="border rounded px-1 py-0.5 text-xs" value={editFixoValues.data} onChange={ev=>setEditFixoValues(v=>({...v,data:ev.target.value}))} /></td>
                      <td className="p-2"><input className="border rounded px-1 py-0.5 text-xs" value={editFixoValues.descricao} onChange={ev=>setEditFixoValues(v=>({...v,descricao:ev.target.value}))} /></td>
                      <td className="p-2"><select className="border rounded px-1 py-0.5 text-xs" value={editFixoValues.forma_pagamento_id} onChange={ev=>setEditFixoValues(v=>({...v,forma_pagamento_id:ev.target.value}))}>{formasPagamento.map(f=> <option key={f.id} value={f.id}>{f.tipo}</option>)}</select></td>
                      <td className="p-2"><input type="checkbox" checked={editFixoValues.pago} onChange={ev=>setEditFixoValues(v=>({...v,pago:ev.target.checked}))} /></td>
                      <td className="p-2 flex items-center gap-2">
                        <input type="number" step="0.01" className="border rounded px-1 py-0.5 text-xs w-24" value={editFixoValues.valor} onChange={ev=>setEditFixoValues(v=>({...v,valor:ev.target.value}))} />
                        <button type="button" onClick={()=>saveFixo(g)} className="text-green-600" title="Salvar"><Check size={16} /></button>
                        <button type="button" onClick={cancelAll} className="text-red-600" title="Cancelar"><X size={16} /></button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={g.id} className="border-t">
                      <td className="p-2">{categorias.find(c=>c.id===g.categoria_id)?.nome || '—'}</td>
                      <td className="p-2">{formatDateDisplay(g.data)}</td>
                      <td className="p-2">{g.descricao}</td>
                      <td className="p-2">{formasPagamento.find(f=>f.id===g.forma_pagamento_id)?.tipo || '—'}</td>
                      <td className="p-2">{g.pago ? 'Sim' : 'Não'}</td>
                      <td className="p-2 flex items-center gap-2">{formatCurrency(g.valor)}
                        <button type="button" onClick={()=> startEditFixo(g)} className="text-blue-600" title="Editar"><Pencil size={14} /></button>
                        <button type="button" onClick={()=> deleteFixo(g.id)} className="text-red-600" title="Remover"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  )
                ))}
                {gastosFixos.length===0 && (
                  <tr><td className="p-2" colSpan={6}>Nenhum gasto fixo</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-sm opacity-70">Total Fixos: {formatCurrency(totalGastosFixos)}</div>
        </Section>

        {/* Gastos Variáveis */}
        <Section title="Gastos Variáveis">
          <form onSubmit={handleSubmitVar} className="grid lg:grid-cols-6 gap-2 mb-4 text-sm">
            <select required className="rounded-md border px-2 py-1" value={formVar.categoria_id} onChange={e=>setFormVar(f=>({...f,categoria_id:e.target.value}))}>
              <option value="">Categoria</option>
              {categorias.map(c=> <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            <input required type="date" className="rounded-md border px-2 py-1" value={formVar.data} onChange={e=>setFormVar(f=>({...f,data:e.target.value}))} />
            <input required placeholder="Descrição" className="rounded-md border px-2 py-1" value={formVar.descricao} onChange={e=>setFormVar(f=>({...f,descricao:e.target.value}))} />
            <select required className="rounded-md border px-2 py-1" value={formVar.forma_pagamento_id} onChange={e=>setFormVar(f=>({...f,forma_pagamento_id:e.target.value}))}>
              <option value="">Pagamento</option>
              {formasPagamento.map(f=> <option key={f.id} value={f.id}>{f.tipo}</option>)}
            </select>
            <input required type="number" step="0.01" placeholder="Valor" className="rounded-md border px-2 py-1" value={formVar.valor} onChange={e=>setFormVar(f=>({...f,valor:e.target.value}))} />
            <button disabled={submitting==='variaveis'} className="rounded-md bg-blue-600 text-white text-sm px-3 py-1 disabled:opacity-50">{submitting==='variaveis'?'Salvando...':'Adicionar'}</button>
          </form>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Categoria</th>
                  <th className="p-2">Data</th>
                  <th className="p-2">Descrição</th>
                  <th className="p-2">Pagamento</th>
                  <th className="p-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                {gastosVariaveis.map(g=> (
                  editingVar===g.id ? (
                    <tr key={g.id} className="border-t bg-blue-50">
                      <td className="p-2"><select className="border rounded px-1 py-0.5 text-xs" value={editVarValues.categoria_id} onChange={ev=>setEditVarValues(v=>({...v,categoria_id:ev.target.value}))}>{categorias.map(c=> <option key={c.id} value={c.id}>{c.nome}</option>)}</select></td>
                      <td className="p-2"><input type="date" className="border rounded px-1 py-0.5 text-xs" value={editVarValues.data} onChange={ev=>setEditVarValues(v=>({...v,data:ev.target.value}))} /></td>
                      <td className="p-2"><input className="border rounded px-1 py-0.5 text-xs" value={editVarValues.descricao} onChange={ev=>setEditVarValues(v=>({...v,descricao:ev.target.value}))} /></td>
                      <td className="p-2"><select className="border rounded px-1 py-0.5 text-xs" value={editVarValues.forma_pagamento_id} onChange={ev=>setEditVarValues(v=>({...v,forma_pagamento_id:ev.target.value}))}>{formasPagamento.map(f=> <option key={f.id} value={f.id}>{f.tipo}</option>)}</select></td>
                      <td className="p-2 flex items-center gap-2">
                        <input type="number" step="0.01" className="border rounded px-1 py-0.5 text-xs w-24" value={editVarValues.valor} onChange={ev=>setEditVarValues(v=>({...v,valor:ev.target.value}))} />
                        <button type="button" onClick={()=>saveVar(g.id)} className="text-green-600" title="Salvar"><Check size={16} /></button>
                        <button type="button" onClick={cancelAll} className="text-red-600" title="Cancelar"><X size={16} /></button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={g.id} className="border-t">
                      <td className="p-2">{categorias.find(c=>c.id===g.categoria_id)?.nome || '—'}</td>
                      <td className="p-2">{formatDateDisplay(g.data)}</td>
                      <td className="p-2">{g.descricao}</td>
                      <td className="p-2">{formasPagamento.find(f=>f.id===g.forma_pagamento_id)?.tipo || '—'}</td>
                      <td className="p-2 flex items-center gap-2">{formatCurrency(g.valor)}
                        <button type="button" onClick={()=> startEditVar(g)} className="text-blue-600" title="Editar"><Pencil size={14} /></button>
                        <button type="button" onClick={()=> deleteVar(g.id)} className="text-red-600" title="Remover"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  )
                ))}
                {gastosVariaveis.length===0 && (
                  <tr><td className="p-2" colSpan={5}>Nenhum gasto variável</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-sm opacity-70">Total Variáveis: {formatCurrency(totalGastosVariaveis)}</div>
        </Section>

        {/* Charts by category and payment type */}
        <Section title="Análises">
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-black/10 p-6 text-center">
              <div className="inline-flex items-center gap-2 mb-2">
                <PieChart size={18} color={palette.secondary} />
                <span className="font-semibold">Categoria · Pizza</span>
              </div>
              <div className="text-sm opacity-70">Em breve</div>
            </div>
            <div className="rounded-xl border border-black/10 p-6 text-center">
              <div className="inline-flex items-center gap-2 mb-2">
                <BarChart3 size={18} color={palette.primary} />
                <span className="font-semibold">Pagamento · Barras</span>
              </div>
              <div className="text-sm opacity-70">Em breve</div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}

export default CompetenciaView
