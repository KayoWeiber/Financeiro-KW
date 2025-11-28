import React, { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type ProtectedRouteProps = { children?: React.ReactNode }

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    let mounted = true
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setAuthenticated(!!data.session)
      setLoading(false)
    }
    init()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <main className="ka-container py-10">
        <div className="ka-card p-6 flex items-center gap-3">
          <img src="/logo-kw-120.png" alt="Financeiro KW" className="h-6 w-6 rounded" loading="lazy" />
          <span>Verificando sessão...</span>
        </div>
      </main>
    )
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children ? children : <Outlet />}</>
}

export default ProtectedRoute
