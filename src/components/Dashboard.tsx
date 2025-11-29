import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'

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

const Card: React.FC<{ title: string; value: string; accent?: string }> = ({ title, value, accent = '#0038A8' }) => (
  <div className="rounded-xl p-4 border border-black/10 bg-white">
    <div className="text-xs opacity-70">{title}</div>
    <div className="mt-1 text-2xl font-bold" style={{ color: accent }}>{value}</div>
  </div>
)

const MiniBar: React.FC<{ data: number[]; labels?: string[]; color?: string }> = ({ data, labels = [], color = '#0038A8' }) => {
  const max = Math.max(1, ...data)
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((v, i) => (
        <div key={i} title={`${labels[i] || i + 1}: ${v.toLocaleString('pt-BR',{ style:'currency', currency:'BRL'})}`}
          className="flex-1 bg-black/10 rounded" style={{ height: `${(v / max) * 100}%`, background: color }} />
      ))}
    </div>
  )
}

function formatBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const Dashboard: React.FC = () => {
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

  // Agregações usando resumoByComp
  const totals = useMemo(() => {
    let entradas = 0
    let despesas = 0
    let investido = 0
    let vale = 0 // categorias com nome contendo 'vale'

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

      // categorias variáveis
      resumo.despesas.variaveis.por_categoria.forEach(cat => {
        const key = String(cat.nome || cat.categoria_id)
        const val = Number(cat.total || 0)
        byCategoria[key] = (byCategoria[key] || 0) + val
        if (key.toLowerCase().includes('vale')) vale += val
      })
      // categorias fixas
      resumo.despesas.fixas.por_categoria.forEach(cat => {
        const key = String(cat.nome || cat.categoria_id)
        const val = Number(cat.total || 0)
        byCategoria[key] = (byCategoria[key] || 0) + val
        if (key.toLowerCase().includes('vale')) vale += val
      })

      // formas de pagamento (se endpoint trouxe combinado, usar; senão combinar variáveis + fixas)
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

  return (
    <div className="min-h-[60vh] p-6">
      <div className="mb-4 flex items-center gap-2">
        <img src="/logo-kw-120.png" alt="Financeiro KW" className="h-7 w-7 rounded" loading="lazy" />
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      {/* Filtro de Ano */}
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm opacity-70">Ano:</label>
        <select
          className="h-9 px-3 rounded border border-black/10 bg-white"
          value={year ?? ''}
          onChange={e => setYear(Number(e.target.value))}
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        {loading && <span className="text-sm opacity-70">Carregando...</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      {/* Cards resumo */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card title="Total de Entradas (ano)" value={formatBRL(totals.entradas)} accent="#2E86DE" />
        <Card title="Total de Despesas (ano)" value={formatBRL(totals.despesas)} accent="#E74C3C" />
        <Card title="Total Investido (ano)" value={formatBRL(totals.investido)} accent="#8E44AD" />
        <Card title="Total Vale (Alimentação)" value={formatBRL(totals.vale)} accent="#FF8800" />
        <Card title="Entradas - Vale" value={formatBRL(totals.netEntradasMinusVale)} accent="#2ECC71" />
      </div>

      {/* Gráficos */}
      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl p-5 border border-black/10 bg-white">
          <div className="text-sm opacity-70 mb-2">Saldo final por mês</div>
          <MiniBar data={totals.saldoFinalMes} labels={mesesPt} color="#2ECC71" />
        </div>

        <div className="rounded-xl p-5 border border-black/10 bg-white">
          <div className="text-sm opacity-70 mb-2">Total de despesas por mês</div>
          <MiniBar data={totals.despesasPorMes} labels={mesesPt} color="#E74C3C" />
        </div>

        <div className="rounded-xl p-5 border border-black/10 bg-white">
          <div className="text-sm opacity-70 mb-3">Total de gastos por Categoria</div>
          <div className="space-y-2">
            {totals.categorias.length === 0 ? (
              <div className="text-sm opacity-70">Sem despesas</div>
            ) : (
              totals.categorias.map(it => (
                <div key={it.key} className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-black/10 rounded">
                    <div className="h-2 rounded" style={{ width: `${Math.min(100, (it.total / (totals.despesas || 1)) * 100)}%`, background: '#FF8800' }} />
                  </div>
                  <div className="text-xs w-28 truncate">{it.key}</div>
                  <div className="text-xs">{formatBRL(it.total)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl p-5 border border-black/10 bg-white">
          <div className="text-sm opacity-70 mb-3">Total de gastos por Forma de Pagamento</div>
          <div className="space-y-2">
            {totals.pagamentos.length === 0 ? (
              <div className="text-sm opacity-70">Sem despesas</div>
            ) : (
              totals.pagamentos.map(it => (
                <div key={it.key} className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-black/10 rounded">
                    <div className="h-2 rounded" style={{ width: `${Math.min(100, (it.total / (totals.despesas || 1)) * 100)}%`, background: '#2E86DE' }} />
                  </div>
                  <div className="text-xs w-28 truncate">{it.key}</div>
                  <div className="text-xs">{formatBRL(it.total)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
