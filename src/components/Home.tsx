import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { LayoutDashboard, Calendar, ChevronRight } from 'lucide-react'

type Competencia = { id: number | string; ano: number; mes: number; ativa?: boolean }

const mesesPt = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const palette = {
  primary: '#0038A8',
  secondary: '#FF8800',
  background: '#F5F5F5',
  contrast: '#333333',
  success: '#2ECC71',
  error: '#E74C3C'
}

const Home: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [competencias, setCompetencias] = useState<Competencia[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        // A API espera o UID (string) em /competencias/:user_id
        // Dê preferência ao UID do Supabase salvo em kw_uid
        let userId: string | null = localStorage.getItem('kw_uid')
        if (!userId) userId = localStorage.getItem('kw_user_id')
        if (!userId) throw new Error('Usuário não identificado')
        const data = await api.getCompetencias(userId)
        // Espera array de competências
        setCompetencias(Array.isArray(data) ? data as Competencia[] : [])
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Falha ao carregar competências'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const ativa = useMemo(() => competencias.find(c => !!c.ativa) || competencias[0], [competencias])

  const grouped = useMemo(() => {
    const byYear: Record<number, Competencia[]> = {}
    for (const c of competencias) {
      const y = Number(c.ano)
      if (!byYear[y]) byYear[y] = []
      byYear[y].push(c)
    }
    // Ordena meses (desc) dentro de cada ano
    Object.keys(byYear).forEach(y => {
      byYear[Number(y)].sort((a, b) => Number(b.mes) - Number(a.mes))
    })
    // Ordena anos (desc)
    const years = Object.keys(byYear).map(n => Number(n)).sort((a, b) => b - a)
    return { byYear, years }
  }, [competencias])

  const [openYears, setOpenYears] = useState<Record<number, boolean>>({})

  const toggleYear = (year: number) =>
    setOpenYears(prev => ({ ...prev, [year]: !prev[year] }))

  return (
    <div className="min-h-screen px-6 py-10" style={{ background: palette.background, color: palette.contrast }}>
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <div
            className="rounded-2xl p-6 text-white shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`
            }}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/15" />
              <div>
                <h1 className="text-2xl font-bold leading-tight">Financeiro KW</h1>
                <p className="text-sm opacity-90">Escolha uma opção para continuar</p>
              </div>
            </div>
            {ativa && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 text-xs font-medium bg-white/15 px-3 py-1 rounded-full">
                  Mês ativo: {mesesPt[(Number(ativa.mes) - 1 + 12) % 12]} / {ativa.ano}
                </span>
                <button
                  onClick={() => navigate(`/competencia/${ativa.id}`)}
                  className="inline-flex items-center gap-2 text-sm font-semibold bg-white text-black px-3 py-1.5 rounded-lg"
                >
                  Ir para mês <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-5 items-start">
          {/* Card Dashboard */}
          <div className="rounded-2xl p-6 shadow-sm border border-black/10 bg-white">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg" style={{ background: `${palette.primary}15` }}>
                    <LayoutDashboard size={18} color={palette.primary} />
                  </span>
                  Dashboard
                </h2>
                <p className="text-sm opacity-70">Visão geral dos seus números</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-5 w-full h-11 rounded-lg font-semibold text-white hover:opacity-95 transition"
              style={{ background: palette.primary }}
            >
              Ver Dashboard
            </button>
          </div>

          {/* Card Meses */}
          <div className="rounded-2xl p-6 shadow-sm border border-black/10 bg-white">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg" style={{ background: `${palette.secondary}26` }}>
                    <Calendar size={18} color={palette.secondary} />
                  </span>
                  Meses
                </h2>
                <p className="text-sm opacity-70">Controle financeiro mensal</p>
              </div>
            </div>

            {loading ? (
              <div className="mt-5 text-sm opacity-70">Carregando competências...</div>
            ) : error ? (
              <div className="mt-5 text-sm text-red-600">{error}</div>
            ) : (
              <>
                {/* Mês ativo em destaque */}
                {ativa && (
                  <div className="mt-4 rounded-lg p-4 border bg-white" style={{ borderColor: `${palette.secondary}55` }}>
                    <div className="text-sm opacity-70">Mês ativo</div>
                    <div className="mt-1 text-lg font-semibold">
                      {mesesPt[(Number(ativa.mes) - 1 + 12) % 12]} / {ativa.ano}
                    </div>
                    <button
                      onClick={() => navigate(`/competencia/${ativa.id}`)}
                      className="mt-3 h-10 px-4 rounded-lg font-semibold text-white hover:opacity-95 transition"
                      style={{ background: palette.secondary }}
                    >
                      Ir para mês
                    </button>
                  </div>
                )}

                {/* Lista de meses agrupada por ano */}
                {competencias.length === 0 ? (
                  <div className="mt-5 text-sm opacity-70">Nenhuma competência encontrada.</div>
                ) : (
                  <div className="mt-5 space-y-5">
                    {grouped.years.map(year => (
                      <div key={year}>
                        <button
                          type="button"
                          onClick={() => toggleYear(year)}
                          className="w-full flex items-center justify-between text-sm font-semibold opacity-90 hover:opacity-100 transition"
                        >
                          <span>{year}</span>
                          <ChevronRight
                            size={16}
                            className="transition-transform"
                            style={{ transform: openYears[year] ? 'rotate(90deg)' : 'rotate(0deg)' }}
                          />
                        </button>
                        {openYears[year] && (
                          <div className="mt-2 grid grid-cols-2 gap-3">
                            {grouped.byYear[year].map(c => (
                              <button
                                key={String(c.id)}
                                onClick={() => navigate(`/competencia/${c.id}`)}
                                className="rounded-lg p-3 border border-black/10 bg-white text-left hover:shadow-sm transition"
                              >
                                <div className="text-sm">
                                  {mesesPt[(Number(c.mes) - 1 + 12) % 12]} / {c.ano}
                                </div>
                                {c.ativa ? (
                                  <span
                                    className="mt-1 inline-block text-xs font-medium text-white px-2 py-0.5 rounded"
                                    style={{ background: palette.success }}
                                  >
                                    Ativa
                                  </span>
                                ) : null}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home