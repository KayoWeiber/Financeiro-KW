import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { api } from '../lib/api'

const palette = {
  primary: '#0038A8',
  secondary: '#FF8800',
  background: '#F5F5F5',
  contrast: '#333333',
  success: '#2ECC71',
  error: '#E74C3C'
}

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
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: palette.background, color: palette.contrast }}
    >
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2">
            <img src="/logo-kw-120-blue.png" alt="Financeiro KW" className="h-9 w-9 rounded-lg" loading="lazy" />
            <h1 className="text-2xl font-bold" style={{ color: palette.primary }}>Financeiro KW</h1>
          </div>
          <p className="text-sm mt-2 opacity-75">Acesso seguro à sua área financeira</p>
        </div>

        <div
          className="rounded-2xl p-6 shadow-xl"
          style={{ background: '#fff', border: `1px solid rgba(0,0,0,0.08)` }}
        >
          {error && (
            <div
              className="mb-4 rounded-lg p-3 text-sm"
              style={{ border: `1.5px solid ${palette.error}`, color: palette.error, background: '#fff' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={signInWithEmail} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border focus:outline-none"
                style={{ borderColor: '#E5E7EB' }}
                placeholder="voce@exemplo.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-11 px-3 pr-10 rounded-lg border focus:outline-none"
                  style={{ borderColor: '#E5E7EB' }}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-2 flex items-center justify-center px-1 text-gray-500 hover:text-gray-700"
                  style={{ background: 'transparent' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              className="w-full h-11 rounded-lg font-semibold"
              style={{ background: palette.primary, color: '#fff' }}
              disabled={loading}
              type="submit"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
