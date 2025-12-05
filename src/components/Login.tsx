import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
import { api } from '../lib/api'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const signInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      setError(error.message)
      return
    }

    // Obter UID do usuário conectado (Supabase)
    const { data: userData } = await supabase.auth.getUser()
    const uid = userData.user?.id
    if (uid) {
      localStorage.setItem('kw_uid', uid)
      try {
        // Tenta conexão com API (healthcheck)
        await api.health()
      } catch (apiErr) {
        console.warn('Falha ao conectar à API:', apiErr)
      }
    }

    setLoading(false)
    navigate('/')
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />

      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="glass-card rounded-2xl p-8 border border-white/10 shadow-2xl relative z-10">

          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 mb-6 shadow-glow">
              <img src="/logo-kw-120-blue.png" alt="Financeiro KW" className="h-10 w-10 object-contain drop-shadow-md" loading="lazy" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent mb-2 tracking-tight">
              Financeiro KW
            </h1>
            <p className="text-sm text-slate-400 font-medium">
              Gestão financeira inteligente e segura
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg p-4 bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={signInWithEmail} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-100 placeholder:text-slate-600 focus:bg-slate-900/80 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300 outline-none"
                placeholder="nome@exemplo.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Senha</label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-12 px-4 pr-12 rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-100 placeholder:text-slate-600 focus:bg-slate-900/80 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300 outline-none"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group mt-2"
              disabled={loading}
              type="submit"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  <span>Acessar Conta</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} Financeiro KW Inc.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Login
