import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'


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
  <main className="ka-container py-12 md:py-16">
        <h1>404</h1>
        <p>Página não encontrada.</p>
        <p>Redirecionando para a página inicial em {seconds} segundo{seconds !== 1 ? 's' : ''}...</p>
    </main>
  )
}

export default NotFound