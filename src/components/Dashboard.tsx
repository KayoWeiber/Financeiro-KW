import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Wallet, CreditCard, TrendingUp, BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Menu, } from 'lucide-react'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import FancySelect, { type FancyOption } from './ui/FancySelect'
import { getCategoryColor, getColorForId } from '../lib/colors'

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

interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: string
  trend?: 'up' | 'down' | 'neutral'
  colorClass?: string
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, trend, colorClass = "bg-primary" }) => (
  <div className="glass-card rounded-2xl p-5 hover:shadow-md transition-all duration-300 group">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 text-opacity-100`}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {React.cloneElement(icon as React.ReactElement<any>, { size: 20, className: colorClass.replace('bg-', 'text-') })}
      </div>
      {trend && (
        <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend === 'up' ? '+12%' : '-5%'}
        </span>
      )}
    </div>
    <div>
      <div className="text-sm text-gray-500 font-medium mb-1">{title}</div>
      <div className="text-2xl font-bold text-gray-800 tracking-tight group-hover:scale-[1.02] origin-left transition-transform">
        {value}
      </div>
    </div>
  </div>
)

const Section: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <section className={`rounded-3xl p-6 glass-card ${className}`}>
    <h2 className="text-lg font-bold mb-6 text-gray-800 flex items-center gap-2">
      <span className="w-1.5 h-6 rounded-full bg-primary/80 block"></span>
      {title}
    </h2>
    {children}
  </section>
)

const MiniBar: React.FC<{ data: number[]; labels?: string[]; color?: string; showValues?: boolean }> = ({ data, labels = [], color = '#3B82F6', showValues = false }) => {
  const max = Math.max(1, ...data.map(n => Math.abs(n)))
  return (
    <div className="relative flex gap-1.5 items-end h-48 pt-6 w-full">
      {data.map((v, i) => {
        const label = labels[i] || String(i + 1)
        const heightPct = (Math.abs(v) / max) * 100
        const valueStr = v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

        return (
          <div key={i} className="flex-1 h-full flex flex-col items-center justify-end min-w-0 group relative">
            {showValues && (
              <div
                className="absolute left-1/2 -translate-x-1/2 -top-6 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none"
              >
                {valueStr}
              </div>
            )}
            <div className="w-full flex items-end h-full px-[1px]">
              <div
                className="w-full rounded-t-sm transition-all duration-500 ease-out hover:opacity-100 opacity-80"
                style={{
                  height: `${heightPct}%`,
                  background: v < 0 ? 'var(--color-destructive)' : color,
                  borderRadius: '4px 4px 0 0'
                }}
              />
            </div>
            <div className="mt-2 text-[10px] font-medium text-gray-400 text-center truncate w-full group-hover:text-primary transition-colors">{label}</div>
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
    const entradasPorMes = Array.from({ length: 12 }, (_, i) => (byMonth[i]?.entradas || 0))
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
      entradasPorMes,
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
          borderWidth: 2,
          borderColor: '#ffffff',
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
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 6
        }
      ]
    }
  }, [totals.pagamentos])

  // Totais por ano para comparação (entradas, despesas, investido)
  const yearsTotals = useMemo(() => {
    const acc: Record<number, { entradas: number; despesas: number; investido: number }> = {}
    for (const c of competencias) {
      const resumo = resumoByComp[String(c.id)]
      if (!resumo) continue
      const y = Number(c.ano)
      if (!acc[y]) acc[y] = { entradas: 0, despesas: 0, investido: 0 }
      const entradasTotal = Number(resumo.entradas.total || 0)
      const despesasVar = Number(resumo.despesas.variaveis.total || 0)
      const despesasFix = Number(resumo.despesas.fixas.total || 0)
      const investimentosTotal = Number(resumo.investimentos.total || 0)
      acc[y].entradas += entradasTotal
      acc[y].despesas += despesasVar + despesasFix
      acc[y].investido += investimentosTotal
    }
    const sortedYears = Object.keys(acc).map(Number).sort((a, b) => a - b)
    return {
      years: sortedYears.map(String),
      entradas: sortedYears.map(y => acc[y].entradas),
      despesas: sortedYears.map(y => acc[y].despesas),
      investido: sortedYears.map(y => acc[y].investido)
    }
  }, [competencias, resumoByComp])

  return (
    <div className="min-h-screen pb-20 font-sans text-slate-800">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <header className="pt-8">
          <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 rounded-2xl bg-white shadow-sm border border-gray-100 p-2 flex items-center justify-center">
                  <img src="/logo-kw-120-blue.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Visão Geral
                  </h1>
                  <p className="text-slate-500 font-medium mt-1">
                    Análise financeira completa de {year}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="min-w-[160px]">
                  <FancySelect
                    value={year ? String(year) : ''}
                    onChange={v => setYear(Number(v))}
                    options={yearOptions}
                    placeholder="Selecione o ano"
                    size="md"
                    className="glass-card"
                  />
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="rounded-xl px-5 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold border border-gray-200 shadow-sm transition-all flex items-center gap-2"
                >
                  <Menu size={18} />
                  <span>Menu</span>
                </button>
              </div>
            </div>
            {loading && <div className="absolute top-0 left-0 w-full h-[3px] bg-primary/20 overflow-hidden"><div className="w-full h-full bg-primary animate-progress-indeterminate origin-left" /></div>}
            {error && <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
          </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          <StatCard
            icon={<Wallet />}
            title="Entradas"
            value={formatBRL(totals.entradas)}
            colorClass="bg-[#0038A8] text-[#0038A8]"
            trend="up"
          />
          <StatCard
            icon={<CreditCard />}
            title="Despesas"
            value={formatBRL(totals.despesas)}
            colorClass="bg-[#E74C3C] text-[#E74C3C]"
            trend="neutral"
          />
          <StatCard
            icon={<TrendingUp />}
            title="Investimentos"
            value={formatBRL(totals.investido)}
            colorClass="bg-[#8E44AD] text-[#8E44AD]"
            trend="up"
          />
          <StatCard
            icon={<CreditCard />}
            title="Vales"
            value={formatBRL(totals.vale)}
            colorClass="bg-[#FF8800] text-[#FF8800]"
          />
          <StatCard
            icon={<BarChart3 />}
            title="Saldo Líquido"
            value={formatBRL(totals.netEntradasMinusVale - totals.despesas)}
            colorClass="bg-[#2ECC71] text-[#2ECC71]"
          />
        </div>

        {/* Main Charts Area */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Section title="Evolução Mensal" className="h-[420px] flex flex-col justify-between">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full">
                <div className="flex flex-col h-full justify-end">
                  <div className="text-xs font-semibold uppercase text-gray-400 mb-4 ml-1">Entradas vs tempo</div>
                  <MiniBar data={totals.entradasPorMes} labels={mesesPt} color="var(--primary)" showValues />
                </div>
                <div className="flex flex-col h-full justify-end">
                  <div className="text-xs font-semibold uppercase text-gray-400 mb-4 ml-1">Despesas vs tempo</div>
                  <MiniBar data={totals.despesasPorMes} labels={mesesPt} color="var(--color-destructive)" showValues />
                </div>
                <div className="flex flex-col h-full justify-end">
                  <div className="text-xs font-semibold uppercase text-gray-400 mb-4 ml-1">Saldo Líquido</div>
                  <MiniBar data={totals.saldoFinalMes} labels={mesesPt} color="var(--color-success)" showValues />
                </div>
              </div>
            </Section>

            {yearsTotals.years.length > 1 && (
              <Section title="Histórico Anual">
                <div className="grid grid-cols-3 gap-8 h-40">
                  <MiniBar data={yearsTotals.entradas} labels={yearsTotals.years} color="#0038A8" />
                  <MiniBar data={yearsTotals.despesas} labels={yearsTotals.years} color="#E74C3C" />
                  <MiniBar data={yearsTotals.investido} labels={yearsTotals.years} color="#8E44AD" />
                </div>
              </Section>
            )}
          </div>

          <div className="space-y-6">
            {/* Pie Charts Cards */}
            <div className="glass-card rounded-3xl p-6">
              <h3 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-2">
                <PieChart size={18} className="text-gray-400" /> Distribuição de Despesas
              </h3>

              <div className="space-y-8">
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">Por Categoria</div>
                  {totals.categorias.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-xl">Sem dados</div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 shrink-0 relative">
                        <Pie data={pieCategoriasData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }} />
                      </div>
                      <div className="flex-1 space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {totals.categorias.sort((a, b) => b.total - a.total).slice(0, 5).map(it => (
                          <div key={it.key} className="flex justify-between items-center text-xs group cursor-default">
                            <span className="flex items-center gap-2 truncate text-gray-600">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: getCategoryColor(it.key) }} />
                              {it.key}
                            </span>
                            <span className="font-semibold text-gray-800">{formatBRL(it.total)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-full h-px bg-gray-100" />

                <div>
                  <div className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">Por Pagamento</div>
                  {totals.pagamentos.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-xl">Sem dados</div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 shrink-0 relative">
                        <Pie data={piePagamentosData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }} />
                      </div>
                      <div className="flex-1 space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {totals.pagamentos.sort((a, b) => b.total - a.total).slice(0, 5).map(it => (
                          <div key={it.key} className="flex justify-between items-center text-xs group cursor-default">
                            <span className="flex items-center gap-2 truncate text-gray-600">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: getColorForId(it.key) }} />
                              {it.key}
                            </span>
                            <span className="font-semibold text-gray-800">{formatBRL(it.total)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Dashboard
