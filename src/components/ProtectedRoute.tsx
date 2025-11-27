import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type ProtectedRouteProps = {
  children: React.ReactNode
}

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
        <div className="ka-card p-6">Verificando sessão...</div>
      </main>
    )
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
