import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Wallet, CreditCard, TrendingUp, BarChart3, PieChart } from 'lucide-react'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import FancySelect, { type FancyOption } from './ui/FancySelect'
import { gradientFor, getCategoryColor, getColorForId } from '../lib/colors'

ChartJS.register(ArcElement, Tooltip, Legend)

type Competencia = { id: number | string; ano: number; mes: number; ativa?: boolean }

// Estrutura retornada pelo endpoint /resumo/:user_id/:competencia_id
interface ResumoCompetencia {
  competencia_id: number | string
  user_id: number | string
  entradas: {
    total: number | string
    por_tipo: { tipo_renda: string; total: number | string }[]
  }
  despesas: {
    variaveis: {
      total: number | string
      por_categoria: { categoria_id: number | string; nome: string; total: number | string }[]
      por_forma_pagamento: { forma_pagamento_id: number | string; tipo: string; total: number | string }[]
    }
    fixas: {
      total: number | string
      por_categoria: { categoria_id: number | string; nome: string; total: number | string }[]
      por_forma_pagamento: { forma_pagamento_id: number | string; tipo: string; total: number | string }[]
    }
  }
  investimentos: { total: number | string }
  formas_pagamento_total?: { forma_pagamento_id: number | string; tipo: string; total: number | string }[]
}

const mesesPt = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// Reuso de padrões de design do CompetenciaView
const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; accent?: string }> = ({ icon, title, value, accent }) => (
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

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="rounded-2xl p-6 shadow-sm" style={{ background: gradientFor(title) }}>
    <h2 className="text-lg font-semibold mb-4 text-gray-800">{title}</h2>
    {children}
  </section>
)

// (Card removido - não utilizado após refatoração)

const MiniBar: React.FC<{ data: number[]; labels?: string[]; color?: string; showValues?: boolean }> = ({ data, labels = [], color = '#0038A8', showValues = false }) => {
  const max = Math.max(1, ...data.map(n => Math.abs(n)))
  return (
    <div className="relative flex gap-1 items-end h-40 pt-4">
      {data.map((v, i) => {
        const label = labels[i] || String(i + 1)
        const heightPct = (Math.abs(v) / max) * 100
        const valueStr = v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        const charLen = valueStr.length
        // Offset baseado no tamanho do texto (mais caracteres => mais afastado para não sobrepor topo da barra)
        const offsetPx = 4 + Math.min(28, charLen * 1.2)
        return (
          <div key={i} className="flex-1 h-full flex flex-col items-center justify-end min-w-0 relative">
            {showValues && (
              <div
                className="absolute left-1/2 -translate-x-1/2 text-[10px] font-medium text-gray-800 whitespace-nowrap pointer-events-none select-none"
                style={{ bottom: `calc(${heightPct}% + ${offsetPx}px)` }}
                title={valueStr}
              >
                {valueStr}
              </div>
            )}
            <div className="w-full flex items-end h-full">
              <div
                title={`${label}: ${valueStr}`}
                className="w-full rounded-md transition-all duration-500 ease-out shadow-sm"
                style={{ height: `${heightPct}%`, background: v < 0 ? '#E74C3C' : color, opacity: 0.95 }}
              />
            </div>
            <div className="mt-2 text-[11px] leading-tight text-center truncate w-full opacity-70" title={label}>{label}</div>
          </div>
        )
      })}
    </div>
  )
}

function formatBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [competencias, setCompetencias] = useState<Competencia[]>([])
  const [year, setYear] = useState<number | null>(null)

  // Cache de resumo por competencia
  const [resumoByComp, setResumoByComp] = useState<Record<string, ResumoCompetencia>>({})

  useEffect(() => {
    const fetchCompetencias = async () => {
      try {
        setLoading(true)
        setError(null)
        let userId: string | null = localStorage.getItem('kw_uid')
        if (!userId) userId = localStorage.getItem('kw_user_id')
        if (!userId) throw new Error('Usuário não identificado')
        const data = await api.getCompetencias(userId)
        const arr = Array.isArray(data) ? (data as Competencia[]) : []
        setCompetencias(arr)
        const ativa = arr.find(c => !!c.ativa)
        setYear(ativa ? Number(ativa.ano) : (arr[0] ? Number(arr[0].ano) : new Date().getFullYear()))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Falha ao carregar competências')
      } finally {
        setLoading(false)
      }
    }
    fetchCompetencias()
  }, [])

  // Carrega resumo para competências do ano selecionado
  useEffect(() => {
    const loadYearResumo = async () => {
      if (!year) return
      const compsYear = competencias.filter(c => Number(c.ano) === year)
      if (compsYear.length === 0) return
      const userId: string | null = localStorage.getItem('kw_uid') || localStorage.getItem('kw_user_id')
      if (!userId) return
      try {
        setLoading(true)
        const promises: Promise<void>[] = []
        for (const c of compsYear) {
          const compId = String(c.id)
          if (!resumoByComp[compId]) {
            promises.push(
              api.getResumo(userId, compId).then((d) => {
                if (d && typeof d === 'object') {
                  setResumoByComp(prev => ({ ...prev, [compId]: d as ResumoCompetencia }))
                } else {
                  setResumoByComp(prev => ({ ...prev, [compId]: undefined as unknown as ResumoCompetencia }))
                }
              })
            )
          }
        }
        await Promise.all(promises)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Falha ao carregar resumo do ano')
      } finally {
        setLoading(false)
      }
    }
    loadYearResumo()
  }, [year, competencias, resumoByComp])

  const years = useMemo(() => Array.from(new Set(competencias.map(c => Number(c.ano)))).sort((a, b) => b - a), [competencias])
  const compsYear = useMemo(() => competencias.filter(c => Number(c.ano) === year), [competencias, year])

  // Opções de anos para FancySelect
  const yearOptions: FancyOption[] = years.map(y => ({ value: String(y), label: String(y) }))

  // Agregações usando resumoByComp
  const totals = useMemo(() => {
    let entradas = 0
    let despesas = 0
    let investido = 0
    let vale = 0

    const byMonth: Record<number, { entradas: number; despesas: number; investido: number }> = {}
    const byCategoria: Record<string, number> = {}
    const byPagamento: Record<string, number> = {}

    for (const c of compsYear) {
      const compId = String(c.id)
      const resumo = resumoByComp[compId]
      if (!resumo) continue
      const monthIndex = (Number(c.mes) - 1 + 12) % 12
      if (!byMonth[monthIndex]) byMonth[monthIndex] = { entradas: 0, despesas: 0, investido: 0 }

      const entradasTotal = Number(resumo.entradas.total || 0)
      const despesasVar = Number(resumo.despesas.variaveis.total || 0)
      const despesasFix = Number(resumo.despesas.fixas.total || 0)
      const investimentosTotal = Number(resumo.investimentos.total || 0)

      entradas += entradasTotal
      despesas += despesasVar + despesasFix
      investido += investimentosTotal

      byMonth[monthIndex].entradas += entradasTotal
      byMonth[monthIndex].despesas += despesasVar + despesasFix
      byMonth[monthIndex].investido += investimentosTotal

      resumo.despesas.variaveis.por_categoria.forEach(cat => {
        const key = String(cat.nome || cat.categoria_id)
        const val = Number(cat.total || 0)
        byCategoria[key] = (byCategoria[key] || 0) + val
        if (key.toLowerCase().includes('vale')) vale += val
      })
      resumo.despesas.fixas.por_categoria.forEach(cat => {
        const key = String(cat.nome || cat.categoria_id)
        const val = Number(cat.total || 0)
        byCategoria[key] = (byCategoria[key] || 0) + val
        if (key.toLowerCase().includes('vale')) vale += val
      })

      if (Array.isArray(resumo.formas_pagamento_total) && resumo.formas_pagamento_total.length) {
        resumo.formas_pagamento_total.forEach(fp => {
          const key = String(fp.tipo || fp.forma_pagamento_id)
          const val = Number(fp.total || 0)
          byPagamento[key] = (byPagamento[key] || 0) + val
        })
      } else {
        resumo.despesas.variaveis.por_forma_pagamento.forEach(fp => {
          const key = String(fp.tipo || fp.forma_pagamento_id)
          const val = Number(fp.total || 0)
          byPagamento[key] = (byPagamento[key] || 0) + val
        })
        resumo.despesas.fixas.por_forma_pagamento.forEach(fp => {
          const key = String(fp.tipo || fp.forma_pagamento_id)
          const val = Number(fp.total || 0)
          byPagamento[key] = (byPagamento[key] || 0) + val
        })
      }
    }

    const saldoFinalMes = Array.from({ length: 12 }, (_, i) => {
      const m = byMonth[i]
      if (!m) return 0
      return m.entradas - m.despesas - m.investido
    })
    const despesasPorMes = Array.from({ length: 12 }, (_, i) => (byMonth[i]?.despesas || 0))
    const categorias = Object.entries(byCategoria).map(([k, v]) => ({ key: k, total: v }))
    const pagamentos = Object.entries(byPagamento).map(([k, v]) => ({ key: k, total: v }))

    return {
      entradas,
      despesas,
      investido,
      vale,
      netEntradasMinusVale: entradas - vale,
      saldoFinalMes,
      despesasPorMes,
      categorias,
      pagamentos
    }
  }, [compsYear, resumoByComp])

  // Dados para gráficos de pizza (categorias e formas de pagamento)
  const pieCategoriasData = useMemo(() => {
    const labels = totals.categorias.map(c => c.key)
    const dataVals = totals.categorias.map(c => c.total)
    return {
      labels,
      datasets: [
        {
          data: dataVals,
          backgroundColor: labels.map(l => getCategoryColor(l)),
          borderWidth: 0,
          hoverOffset: 6
        }
      ]
    }
  }, [totals.categorias])

  const piePagamentosData = useMemo(() => {
    const labels = totals.pagamentos.map(p => p.key)
    const dataVals = totals.pagamentos.map(p => p.total)
    return {
      labels,
      datasets: [
        {
          data: dataVals,
          backgroundColor: labels.map(l => getColorForId(l)),
          borderWidth: 0,
          hoverOffset: 6
        }
      ]
    }
  }, [totals.pagamentos])

  return (
    <div className="min-h-screen px-6 py-8 bg-white text-gray-900">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header>
          <div className="rounded-2xl p-6 shadow-sm bg-[linear-gradient(135deg,#f5f7fa,#e4ebf3)] border border-gray-200">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <img src="/logo-kw-120-blue.png" alt="Financeiro KW" className="h-10 w-10 rounded-xl bg-white p-1 object-contain border border-gray-200" loading="lazy" />
                <div>
                  <h1 className="text-2xl font-bold leading-tight text-gray-800">Dashboard Anual</h1>
                  <p className="text-sm text-gray-600">Resumo consolidado por ano das competências</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="min-w-[140px]">
                  <FancySelect
                    value={year ? String(year) : ''}
                    onChange={v => setYear(Number(v))}
                    options={yearOptions}
                    placeholder="Ano"
                    size="sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="rounded-md bg-gray-800 hover:bg-gray-900 text-white text-xs px-3 py-2 shadow-sm transition-colors cursor-pointer"
                  title="Voltar ao menu"
                >
                  Menu
                </button>
                {loading && <span className="text-xs opacity-70">Carregando...</span>}
                {error && <span className="text-xs text-red-600">{error}</span>}
              </div>
            </div>
          </div>
        </header>

        {/* Summary cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={<Wallet size={18} color="#0038A8" />} title="Entradas" value={formatBRL(totals.entradas)} accent="#0038A81A" />
          <StatCard icon={<CreditCard size={18} color="#E74C3C" />} title="Despesas" value={formatBRL(totals.despesas)} accent="#E74C3C1A" />
          <StatCard icon={<TrendingUp size={18} color="#8E44AD" />} title="Investido" value={formatBRL(totals.investido)} accent="#8E44AD26" />
          <StatCard icon={<CreditCard size={18} color="#FF8800" />} title="Vale" value={formatBRL(totals.vale)} accent="#FF880026" />
          <StatCard icon={<BarChart3 size={18} color="#2ECC71" />} title="Entradas - Vale" value={formatBRL(totals.netEntradasMinusVale)} accent="#2ECC7126" />
        </div>

        {/* Charts */}
        <Section title="Gráficos">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-black/10 p-5 bg-white flex flex-col">
              <div className="text-sm font-medium mb-2">Saldo final por mês</div>
              <MiniBar data={totals.saldoFinalMes} labels={mesesPt} color="#2ECC71" showValues />
            </div>
            <div className="rounded-xl border border-black/10 p-5 bg-white flex flex-col">
              <div className="text-sm font-medium mb-2">Despesas por mês</div>
              <MiniBar data={totals.despesasPorMes} labels={mesesPt} color="#E74C3C" showValues />
            </div>
          </div>
        </Section>

        {/* Analysis (Pie Charts) */}
        <Section title="Análises">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-black/10 p-5 bg-white flex flex-col">
              <div className="flex items-center gap-2 mb-3"><PieChart size={16} className="text-[#FF8800]" /><span className="text-sm font-medium">Despesas por Categoria</span></div>
              {totals.categorias.length === 0 ? (
                <div className="text-xs opacity-70">Sem despesas</div>
              ) : (
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 h-64"><Pie data={pieCategoriasData} options={{ maintainAspectRatio:false, plugins:{ legend:{ display:false }}}} /></div>
                  <ul className="flex-1 space-y-2 text-xs md:text-sm max-h-64 overflow-y-auto pr-1">
                    {totals.categorias.sort((a,b)=> b.total - a.total).map(it => (
                      <li key={it.key} className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background:getCategoryColor(it.key) }} />
                          <span className="truncate" title={it.key}>{it.key}</span>
                        </span>
                        <span className="font-medium text-gray-700">{formatBRL(it.total)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="rounded-xl border border-black/10 p-5 bg-white flex flex-col">
              <div className="flex items-center gap-2 mb-3"><PieChart size={16} className="text-[#0038A8]" /><span className="text-sm font-medium">Despesas por Forma de Pagamento</span></div>
              {totals.pagamentos.length === 0 ? (
                <div className="text-xs opacity-70">Sem despesas</div>
              ) : (
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 h-64"><Pie data={piePagamentosData} options={{ maintainAspectRatio:false, plugins:{ legend:{ display:false }}}} /></div>
                  <ul className="flex-1 space-y-2 text-xs md:text-sm max-h-64 overflow-y-auto pr-1">
                    {totals.pagamentos.sort((a,b)=> b.total - a.total).map(it => (
                      <li key={it.key} className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background:getColorForId(it.key) }} />
                          <span className="truncate" title={it.key}>{it.key}</span>
                        </span>
                        <span className="font-medium text-gray-700">{formatBRL(it.total)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}

export default Dashboard
