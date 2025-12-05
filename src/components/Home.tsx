import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { LayoutDashboard, Calendar, ChevronRight, LogOut, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

type Competencia = { id: number | string; ano: number; mes: number; ativa?: boolean }

const mesesPt = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const Home: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [competencias, setCompetencias] = useState<Competencia[]>([])
  const [openYears, setOpenYears] = useState<Record<number, boolean>>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        let userId: string | null = localStorage.getItem('kw_uid')
        if (!userId) userId = localStorage.getItem('kw_user_id')
        if (!userId) throw new Error('Usuário não identificado')
        const data = await api.getCompetencias(userId)
        const comps = Array.isArray(data) ? data as Competencia[] : []
        setCompetencias(comps)

        // Auto-open current year
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth() + 1 // 1-12

        // Check for auto-activation
        const currentComp = comps.find(c => Number(c.ano) === currentYear && Number(c.mes) === currentMonth)
        const activeComp = comps.find(c => c.ativa)

        if (currentComp && !currentComp.ativa && (!activeComp || Number(activeComp.mes) !== currentMonth || Number(activeComp.ano) !== currentYear)) {
          // If current month exists but is not active, activate it
          try {
            // Explicitly deactivate the previous active one if it exists
            if (activeComp) {
              await api.updateCompetencia(activeComp.id, { ativa: false })
            }

            await api.ativarCompetencia({
              user_id: userId,
              ano: currentYear,
              mes: currentMonth,
              ativa: true
            })
            // Re-fetch to ensure consistency
            const updatedData = await api.getCompetencias(userId)
            const updatedComps = Array.isArray(updatedData) ? updatedData as Competencia[] : []
            setCompetencias(updatedComps)

            setOpenYears({ [currentYear]: true })
          } catch (err) {
            console.error('Failed to auto-activate competence:', err)
            // Fallback
            const yearToOpen = activeComp ? Number(activeComp.ano) : currentYear
            setOpenYears({ [yearToOpen]: true })
          }
        } else {
          // Normal behavior
          const yearToOpen = activeComp ? Number(activeComp.ano) : currentYear
          setOpenYears({ [yearToOpen]: true })
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Falha ao carregar competências'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const grouped = useMemo(() => {
    const byYear: Record<number, Competencia[]> = {}
    for (const c of competencias) {
      const y = Number(c.ano)
      if (!byYear[y]) byYear[y] = []
      byYear[y].push(c)
    }
    Object.keys(byYear).forEach(y => {
      byYear[Number(y)].sort((a, b) => Number(b.mes) - Number(a.mes))
    })
    const years = Object.keys(byYear).map(n => Number(n)).sort((a, b) => b - a)
    return { byYear, years }
  }, [competencias])

  const toggleYear = (year: number) =>
    setOpenYears(prev => ({ ...prev, [year]: !prev[year] }))

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('kw_uid')
    localStorage.removeItem('kw_user_id')
    navigate('/login')
  }

  return (
    <div className="min-h-screen font-sans text-slate-800 pb-20">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-10">

        {/* Header */}
        <header className="py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white shadow-sm border border-gray-100 p-2 flex items-center justify-center">
              <img src="/logo-kw-120-blue.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Bem-vindo(a)
              </h1>
              <p className="text-slate-500 text-sm font-medium">Financeiro KW</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
          >
            <LogOut size={16} />
            <span>Sair da conta</span>
          </button>
        </header>

        {/* Dashboard Banner */}
        <div className="mb-10 group cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="glass-card rounded-3xl p-8 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.01] border-l-4 border-l-primary/0 hover:border-l-primary">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
                  <LayoutDashboard size={14} />
                  <span>Visão Geral</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Dashboard Anual</h2>
                <p className="text-slate-500 max-w-md">
                  Obtenha insights detalhados sobre suas finanças, acompanhe tendências e visualize o crescimento do seu patrimônio.
                </p>
              </div>
              <div className="shrink-0 rounded-full bg-white/80 p-3 shadow-sm group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <ArrowRight size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Competências Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="text-primary" size={20} />
              Minhas Competências
            </h3>
            {/* Placeholder for future "New Competencia" button if needed */}
            {/* <button className="p-2 rounded-full bg-primary text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"><Plus size={20} /></button> */}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 rounded-2xl bg-gray-200/50 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-50 text-red-600 text-center border border-red-100">{error}</div>
          ) : (
            <div className="space-y-8">
              {grouped.years.map(year => (
                <div key={year} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <button
                    onClick={() => toggleYear(year)}
                    className="flex items-center gap-3 w-full group mb-4"
                  >
                    <h4 className="text-2xl font-bold text-slate-300 group-hover:text-primary transition-colors">{year}</h4>
                    <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent group-hover:from-primary/20 transition-all" />
                    <ChevronRight size={20} className={`text-gray-300 group-hover:text-primary transition-all duration-300 ${openYears[year] ? 'rotate-90' : ''}`} />
                  </button>

                  {openYears[year] && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {grouped.byYear[year].map(c => {
                        const isActive = c.ativa
                        const monthName = mesesPt[(Number(c.mes) - 1 + 12) % 12]

                        return (
                          <div
                            key={c.id}
                            onClick={() => navigate(`/competencia/${c.id}`)}
                            className={`
                                   group relative glass-card rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border overflow-hidden
                                   ${isActive ? 'border-primary/30 ring-1 ring-primary/20' : 'border-white/40'}
                                 `}
                          >
                            {isActive && (
                              <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-bl-xl shadow-sm z-10">
                                Ativa
                              </div>
                            )}

                            <div className="flex items-center gap-4 mb-3">
                              <div className={`
                                      w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-inner
                                      ${isActive ? 'bg-primary text-white shadow-primary/20' : 'bg-gray-100 text-gray-500'}
                                    `}>
                                {monthName.substring(0, 3)}
                              </div>
                              <div>
                                <div className="text-sm text-gray-500">Competência</div>
                                <div className="font-semibold text-gray-800">{monthName} / {c.ano}</div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100/50">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${isActive ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                                {isActive ? 'Em aberto' : 'Fechada'}
                              </span>
                              <ArrowRight size={16} className={`transition-transform duration-300 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                            </div>

                            {/* Hover gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Home