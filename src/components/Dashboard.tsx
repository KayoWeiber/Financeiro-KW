import React from 'react'

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-[60vh] p-6">
      <div className="mb-4 flex items-center gap-2">
        <img src="/logo-kw-120.png" alt="Financeiro KW" className="h-7 w-7 rounded" loading="lazy" />
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      <p className="opacity-70">Em breve: visão geral de receitas, despesas e saldo.</p>
    </div>
  )
}

export default Dashboard
