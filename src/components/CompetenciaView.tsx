import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BarChart3, CreditCard, PieChart, Wallet, TrendingUp } from 'lucide-react'
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

const mesesPt = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const CompetenciaView: React.FC = () => {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [competenciaAtual, setCompetenciaAtual] = useState<Competencia | null>(null)

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
          <StatCard icon={<Wallet size={18} color={palette.primary} />} title="Entradas" value="R$ 0,00" accent={`${palette.primary}1A`} />
          <StatCard icon={<CreditCard size={18} color={palette.error} />} title="Despesas" value="R$ 0,00" accent={`${palette.error}1A`} />
          <StatCard icon={<TrendingUp size={18} color={palette.secondary} />} title="Investido" value="R$ 0,00" accent={`${palette.secondary}26`} />
          <StatCard icon={<BarChart3 size={18} color={palette.success} />} title="Saldo" value="R$ 0,00" accent={`${palette.success}26`} />
        </div>

        {/* Mid summary card */}
        <Section title="Resumo">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-xl p-4 border border-black/10">
              <div className="text-xs opacity-70">Investido</div>
              <div className="text-lg font-semibold">R$ 0,00</div>
            </div>
            <div className="rounded-xl p-4 border border-black/10">
              <div className="text-xs opacity-70">Saídas</div>
              <div className="text-lg font-semibold">R$ 0,00</div>
            </div>
            <div className="rounded-xl p-4 border border-black/10">
              <div className="text-xs opacity-70">Saldo Atual</div>
              <div className="text-lg font-semibold">R$ 0,00</div>
            </div>
          </div>
        </Section>

        {/* Charts placeholder */}
        <Section title="Gráficos">
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-black/10 p-6 text-center">
              <div className="inline-flex items-center gap-2 mb-2">
                <PieChart size={18} color={palette.secondary} />
                <span className="font-semibold">Gastos por Categoria</span>
              </div>
              <div className="text-sm opacity-70">Em breve: gráfico de pizza</div>
            </div>
            <div className="rounded-xl border border-black/10 p-6 text-center">
              <div className="inline-flex items-center gap-2 mb-2">
                <BarChart3 size={18} color={palette.primary} />
                <span className="font-semibold">Gastos por Forma de Pagamento</span>
              </div>
              <div className="text-sm opacity-70">Em breve: gráfico de barras</div>
            </div>
          </div>
        </Section>

        {/* Entradas */}
        <Section title="Entradas">
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
                <tr>
                  <td className="p-2">—</td>
                  <td className="p-2">—</td>
                  <td className="p-2">—</td>
                  <td className="p-2">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* Investimentos */}
        <Section title="Investimentos">
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
                <tr>
                  <td className="p-2">—</td>
                  <td className="p-2">—</td>
                  <td className="p-2">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* Gastos Fixos */}
        <Section title="Gastos Fixos">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Categoria</th>
                  <th className="p-2">Data</th>
                  <th className="p-2">Descrição</th>
                  <th className="p-2">Forma de Pagamento</th>
                  <th className="p-2">Pago</th>
                  <th className="p-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2">—</td>
                  <td className="p-2">—</td>
                  <td className="p-2">—</td>
                  <td className="p-2">—</td>
                  <td className="p-2">—</td>
                  <td className="p-2">—</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-sm opacity-70">Total Fixos: R$ 0,00</div>
        </Section>

        {/* Gastos Variáveis */}
        <Section title="Gastos Variáveis">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Categoria</th>
                  <th className="p-2">Data</th>
                  <th className="p-2">Descrição</th>
                  <th className="p-2">Forma de Pagamento</th>
                  <th className="p-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2">—</td>
                  <td className="p-2">—</td>
                  <td className="p-2">—</td>
                  <td className="p-2">—</td>
                  <td className="p-2">—</td>
                </tr>
              </tbody>
            </table>
          </div>
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
