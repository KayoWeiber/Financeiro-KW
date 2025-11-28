import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const palette = {
  primary: '#0038A8',
  secondary: '#FF8800',
  background: '#F5F5F5',
  contrast: '#333333'
}


const NotFound: React.FC = () => {
  const navigate = useNavigate()
  const [seconds, setSeconds] = useState(5)

  useEffect(() => {
    if (seconds <= 0) {
      navigate('/')
      return
    }

    const timer = setTimeout(() => setSeconds(s => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [seconds, navigate])

  return (
    <div className="min-h-screen px-6 py-10" style={{ background: palette.background, color: palette.contrast }}>
      <div className="max-w-3xl mx-auto">
        <header className="mb-6">
          <div
            className="rounded-2xl p-6 text-white shadow-sm"
            style={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})` }}
          >
            <div className="flex items-center gap-3">
              <img src="/logo-kw-120.png" alt="Financeiro KW" className="h-10 w-10 rounded-xl bg-white/10 p-1 object-contain" loading="lazy" />
              <div>
                <h1 className="text-2xl font-bold leading-tight">Financeiro KW</h1>
                <p className="text-sm opacity-90">Página não encontrada</p>
              </div>
            </div>
          </div>
        </header>

        <div className="rounded-2xl p-6 shadow-sm border border-black/10 bg-white">
          <div className="text-5xl font-extrabold" style={{ color: palette.primary }}>404</div>
          <p className="mt-2 opacity-80">Oops! Não encontramos o que você procurava.</p>
          <p className="mt-1 text-sm opacity-70">
            Redirecionando para a página inicial em {seconds} segundo{seconds !== 1 ? 's' : ''}...
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 h-10 px-4 rounded-lg font-semibold text-white hover:opacity-95 transition"
            style={{ background: palette.primary }}
          >
            Ir para Home agora
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotFound