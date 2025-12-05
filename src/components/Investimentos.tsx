import React, { useEffect, useMemo, useState } from 'react'
import FancySelect, { type FancyOption } from './ui/FancySelect'
import { api } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend, type TooltipItem } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

type Competencia = { id: number | string; ano: number; mes: number; ativa?: boolean }
type MetaApiItem = { id: number | string; competencia_id: number | string; valor_meta: number | string }
type ResumoInvest = { investimentos?: { total?: number | string } }

function formatBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function parseMetaNumber(input: string): number {
  let s = (input || '').trim()
  if (!s) return 0
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.')
  }
  return Number(s)
}

function normalizeMetaString(input: string): string {
  let s = (input || '').trim()
  if (!s) return ''
  // remove espaços
  s = s.replace(/\s+/g, '')
  // Se não tiver vírgula, adiciona ,00
  if (!s.includes(',')) return `${s},00`
  // Se tiver vírgula, garantir 2 casas
  const [intPart, decPartRaw] = s.split(',')
  const decPart = decPartRaw ?? ''
  if (decPart.length === 0) return `${intPart},00`
  if (decPart.length === 1) return `${intPart},${decPart}0`
  // Mais que 2: truncar para 2
  return `${intPart},${decPart.substring(0,2)}`
}

function formatMetaStringFromNumber(n: number): string {
  if (!isFinite(n)) return ''
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const mesesPt = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const Investimentos: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [competencias, setCompetencias] = useState<Competencia[]>([])

  const years = useMemo(() => Array.from(new Set(competencias.map(c => Number(c.ano)))).sort((a,b) => b - a), [competencias])
  const [year, setYear] = useState<number | null>(null)

  // Mapeamentos por competência do ano
  const [metaByComp, setMetaByComp] = useState<Record<string, { id: string | null; valor: number }>>({})
  const [metaInput, setMetaInput] = useState<Record<string, string>>({})
  const [investidoByComp, setInvestidoByComp] = useState<Record<string, number>>({})
  const [savingState, setSavingState] = useState<Record<string, 'idle' | 'saved' | 'error'>>({})
  const [bulkMeta, setBulkMeta] = useState<string>('')
    const [openMetas, setOpenMetas] = useState<boolean>(true)

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true)
        setError(null)
        let userId: string | null = localStorage.getItem('kw_uid')
        if (!userId) userId = localStorage.getItem('kw_user_id')
        if (!userId) throw new Error('Usuário não identificado')

        const comps = await api.getCompetencias(userId)
        const arr = Array.isArray(comps) ? comps as Competencia[] : []
        setCompetencias(arr)
        const ativa = arr.find(c => !!c.ativa)
        setYear(ativa ? Number(ativa.ano) : (arr[0] ? Number(arr[0].ano) : new Date().getFullYear()))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Falha ao carregar dados')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // Carregar metas e investidos para o ano selecionado
  useEffect(() => {
    const loadYearData = async () => {
      if (!year) return
      try {
        setLoading(true)
        setError(null)
        let userId: string | null = localStorage.getItem('kw_uid')
        if (!userId) userId = localStorage.getItem('kw_user_id')
        if (!userId) throw new Error('Usuário não identificado')

        const compsYear = competencias.filter(c => Number(c.ano) === year)

        // Fetch metas and resumo in parallel per competencia
        const metaMap: Record<string, { id: string | null; valor: number }> = {}
        const inputMap: Record<string, string> = {}
        const invMap: Record<string, number> = {}

        await Promise.all(
          compsYear.map(async c => {
            const compId = String(c.id)
            // metas
            try {
              const metas = await api.getMetasInvestimentos(compId)
              const metasArr = Array.isArray(metas) ? (metas as MetaApiItem[]) : []
              const meta = metasArr.length ? metasArr[0] : null
              metaMap[compId] = { id: meta ? String(meta.id) : null, valor: meta ? Number(meta.valor_meta) : 0 }
              inputMap[compId] = meta ? String(meta.valor_meta) : ''
            } catch (err) {
              console.warn('Falha ao carregar meta', compId, err)
            }
            // resumo investido
            try {
              const resumo = await api.getResumo(userId!, compId) as unknown as ResumoInvest
              const totalInvest = Number(resumo?.investimentos?.total ?? 0)
              invMap[compId] = totalInvest
            } catch (err) {
              console.warn('Falha ao carregar resumo', compId, err)
            }
          })
        )

        setMetaByComp(metaMap)
        setMetaInput(inputMap)
        setInvestidoByComp(invMap)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Falha ao carregar metas/investidos do ano')
      } finally {
        setLoading(false)
      }
    }
    loadYearData()
  }, [year, competencias])

  const yearsOptions: FancyOption[] = years.map(y => ({ value: String(y), label: String(y) }))
  const compsOfYear = useMemo(() => {
    return competencias
      .filter(c => Number(c.ano) === year)
      .sort((a,b) => Number(a.mes) - Number(b.mes))
  }, [competencias, year])

  const compByMonth: Record<number, Competencia | undefined> = useMemo(() => {
    const map: Record<number, Competencia | undefined> = {}
    compsOfYear.forEach(c => { map[Number(c.mes)] = c })
    return map
  }, [compsOfYear])

  useEffect(() => {
    // Ao trocar de ano, recolhe por padrão
    setOpenMetas(true)
  }, [year])

  const handleSaveRow = async (compId: string) => {
    try {
      setError(null)
      let userId: string | null = localStorage.getItem('kw_uid')
      if (!userId) userId = localStorage.getItem('kw_user_id')
      if (!userId) throw new Error('Usuário não identificado')

      const current = metaByComp[compId]
      const normalized = normalizeMetaString(metaInput[compId] || '')
      setMetaInput(prev => ({ ...prev, [compId]: normalized }))
      const val = parseMetaNumber(normalized)
      // Regra: valor vazio ou <= 0 significa remover meta se existir
      if (!val || val <= 0) {
        if (current?.id) {
          await api.deleteMetaInvestimento(current.id)
          setMetaByComp(prev => ({ ...prev, [compId]: { id: null, valor: 0 } }))
          setMetaInput(prev => ({ ...prev, [compId]: '' }))
        }
      } else {
        if (current && current.id) {
          await api.updateMetaInvestimento(current.id, val)
        } else {
          await api.createMetaInvestimento({ user_id: userId, competencia_id: compId, valor_meta: val })
        }
        // Refresh row state
        const metas = await api.getMetasInvestimentos(compId)
        const metasArr = Array.isArray(metas) ? (metas as MetaApiItem[]) : []
        const meta = metasArr.length ? metasArr[0] : null
        const metaNumber = meta ? Number(meta.valor_meta) : 0
        setMetaByComp(prev => ({ ...prev, [compId]: { id: meta ? String(meta.id) : null, valor: metaNumber } }))
        setMetaInput(prev => ({ ...prev, [compId]: meta ? formatMetaStringFromNumber(metaNumber) : '' }))
      }
      setSavingState(prev => ({ ...prev, [compId]: 'saved' }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar meta')
      setSavingState(prev => ({ ...prev, [compId]: 'error' }))
    } finally {
      // no-op
    }
  }

  const handleDeleteRow = async (compId: string) => {
    try {
      const current = metaByComp[compId]
      if (!current || !current.id) return
      setLoading(true)
      await api.deleteMetaInvestimento(current.id)
      setMetaByComp(prev => ({ ...prev, [compId]: { id: null, valor: 0 } }))
      setMetaInput(prev => ({ ...prev, [compId]: '' }))
      setSavingState(prev => ({ ...prev, [compId]: 'saved' }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao apagar meta')
      setSavingState(prev => ({ ...prev, [compId]: 'error' }))
    } finally {
      // no-op
    }
  }

  // Desabilitado: salvamento apenas ao clicar no botão

  // Dados para gráfico anual
  const chartData = useMemo(() => {
    const labels = mesesPt
    const metas = labels.map((_, idx) => {
      const month = idx + 1
      const comp = compByMonth[month]
      if (!comp) return 0
      const m = metaByComp[String(comp.id)]
      return m ? m.valor : 0
    })
    const investidos = labels.map((_, idx) => {
      const month = idx + 1
      const comp = compByMonth[month]
      if (!comp) return 0
      return investidoByComp[String(comp.id)] || 0
    })
    return {
      labels,
      datasets: [
        {
          label: 'Meta',
          data: metas,
          backgroundColor: '#8E44AD',
          borderRadius: 6,
          maxBarThickness: 20
        },
        {
          label: 'Investido',
          data: investidos,
          backgroundColor: '#2ECC71',
          borderRadius: 6,
          maxBarThickness: 20
        }
      ]
    }
  }, [metaByComp, investidoByComp, compByMonth])

  const chartMax = useMemo(() => {
    const allVals = [
      ...(chartData.datasets?.[0]?.data as number[] || []),
      ...(chartData.datasets?.[1]?.data as number[] || [])
    ]
    const maxVal = Math.max(0, ...allVals)
    return maxVal > 0 ? Math.ceil(maxVal * 1.15) : 10
  }, [chartData])

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: { callbacks: { label: (ctx: TooltipItem<'bar'>) => `${ctx.dataset.label}: ${formatBRL(Number(ctx.parsed.y))}` } }
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: chartMax,
        ticks: {
          callback: (value: number | string) => formatBRL(Number(value))
        }
      }
    }
  }), [chartMax])

  return (
    <div className="min-h-screen px-6 py-8 bg-white text-gray-900">
      <div className="max-w-6xl mx-auto space-y-6">
        <header>
          <div className="rounded-2xl p-6 shadow-sm bg-[linear-gradient(135deg,#f5f7fa,#e4ebf3)] border border-gray-200">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <img src="/logo-kw-120-blue.png" alt="Financeiro KW" className="h-10 w-10 rounded-xl bg-white p-1 object-contain border border-gray-200" loading="lazy" />
                <div>
                  <h1 className="text-2xl font-bold leading-tight text-gray-800">Investimentos</h1>
                  <p className="text-sm text-gray-600">Metas por mês e comparação anual</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="min-w-[140px]">
                  <FancySelect
                    value={year ? String(year) : ''}
                    onChange={v => setYear(Number(v))}
                    options={yearsOptions}
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

        <section className="rounded-2xl p-0 shadow-sm bg-white border border-black/10 overflow-hidden">
          <button
            type="button"
            onClick={() => setOpenMetas(v => !v)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50"
          >
            <h2 className="text-lg font-semibold text-gray-800">Metas por mês</h2>
            <div className="text-gray-400 text-xl leading-none">{openMetas ? '−' : '+'}</div>
          </button>
          {openMetas && (
            <div className="px-6 pb-6">
              <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
                {Array.from({ length: 12 }, (_, idx) => {
                  const month = idx + 1
                  const comp = compByMonth[month]
                  const compId = comp ? String(comp.id) : ''
                  const hasComp = !!compId
                  const inputVal = compId ? (metaInput[compId] ?? '') : ''
                  const investedVal = compId ? (investidoByComp[compId] || 0) : 0
                  return (
                    <div key={month} className="flex items-center gap-4 px-4 py-3 bg-white">
                      <div className="w-10 shrink-0 font-medium text-gray-800">{mesesPt[idx]}</div>
                      <div className="flex items-end gap-3 flex-wrap">
                        <div>
                          <label className="text-xs opacity-70">Meta (R$)</label>
                          <input
                            type="text"
                            disabled={!hasComp}
                            value={inputVal}
                            onChange={e => {
                              if (!hasComp) return
                              const v = e.target.value
                              if (/^[0-9.,]*$/.test(v)) {
                                setMetaInput(prev => ({ ...prev, [compId]: v }))
                              }
                            }}
                            onBlur={() => { /* salvar apenas no botão */ }}
                            className="block mt-1 w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm disabled:bg-gray-50"
                            placeholder="0,00"
                          />
                        </div>
                        <div className="text-sm text-gray-700">
                          <span className="opacity-70">Investido:</span> <span className="font-semibold">{formatBRL(investedVal)}</span>
                        </div>
                        <div className="text-xs">
                          {hasComp ? (
                            savingState[compId] === 'saved' ? (
                              <span className="text-green-600">Salvo</span>
                            ) : savingState[compId] === 'error' ? (
                              <span className="text-red-600">Erro</span>
                            ) : metaByComp[compId]?.id ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(compId)}
                                className="rounded-md bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 shadow-sm"
                              >
                                Remover
                              </button>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )
                          ) : (
                            <span className="text-gray-400">Sem competência</span>
                          )}
                        </div>
                        {hasComp && (
                          <button
                            type="button"
                            onClick={() => void handleSaveRow(compId)}
                            className="rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 shadow-sm"
                          >
                            Salvar
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Ações em massa */}
              <div className="mt-4 flex items-end gap-3 flex-wrap">
                <div>
                  <label className="text-xs opacity-70">Meta padrão para aplicar (R$)</label>
                  <input
                    type="text"
                    value={bulkMeta}
                    onChange={e => { const v = e.target.value; if (/^[0-9.,]*$/.test(v)) setBulkMeta(v) }}
                    className="block mt-1 w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    placeholder="0,00"
                  />
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const norm = normalizeMetaString(bulkMeta)
                    const val = parseMetaNumber(norm)
                    if (!val || val <= 0) { setError('Informe um valor válido (> 0)'); return }
                    const userId: string | null = localStorage.getItem('kw_uid') || localStorage.getItem('kw_user_id')
                    if (!userId) { setError('Usuário não identificado'); return }
                    const updates = compsOfYear.map(async c => {
                      const compId = String(c.id)
                      const current = metaByComp[compId]
                      if (current?.id) {
                        await api.updateMetaInvestimento(current.id, val)
                      } else {
                        await api.createMetaInvestimento({ user_id: userId!, competencia_id: compId, valor_meta: val })
                      }
                      setMetaByComp(prev => ({ ...prev, [compId]: { id: prev[compId]?.id ?? 'tmp', valor: val } }))
                      setMetaInput(prev => ({ ...prev, [compId]: String(val) }))
                    })
                    await Promise.all(updates)
                  }}
                  className="rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 shadow-sm"
                >
                  Aplicar em todos os meses
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const norm = normalizeMetaString(bulkMeta)
                    const val = parseMetaNumber(norm)
                    if (!val || val <= 0) { setError('Informe um valor válido (> 0)'); return }
                    const userId: string | null = localStorage.getItem('kw_uid') || localStorage.getItem('kw_user_id')
                    if (!userId) { setError('Usuário não identificado'); return }
                    const updates = compsOfYear.map(async c => {
                      const compId = String(c.id)
                      const current = metaByComp[compId]
                      if (!current || !current.id) {
                        await api.createMetaInvestimento({ user_id: userId!, competencia_id: compId, valor_meta: val })
                        setMetaByComp(prev => ({ ...prev, [compId]: { id: prev[compId]?.id ?? 'tmp', valor: val } }))
                        setMetaInput(prev => ({ ...prev, [compId]: String(val) }))
                      }
                    })
                    await Promise.all(updates)
                  }}
                  className="rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 shadow-sm"
                >
                  Aplicar apenas nos vazios
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const deletions = compsOfYear.map(async c => {
                      const compId = String(c.id)
                      const current = metaByComp[compId]
                      if (current?.id) {
                        await api.deleteMetaInvestimento(current.id)
                        setMetaByComp(prev => ({ ...prev, [compId]: { id: null, valor: 0 } }))
                        setMetaInput(prev => ({ ...prev, [compId]: '' }))
                      }
                    })
                    await Promise.all(deletions)
                  }}
                  className="rounded-md bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 shadow-sm"
                >
                  Limpar metas do ano
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Gráfico anual de comparação */}
        <section className="rounded-2xl p-6 shadow-sm bg-white border border-black/10">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Comparação anual: Meta x Investido</h2>
          <div className="h-80">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </section>
      </div>
    </div>
  )
}

export default Investimentos
