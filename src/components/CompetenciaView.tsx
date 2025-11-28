import React from 'react'
import { useParams } from 'react-router-dom'

const CompetenciaView: React.FC = () => {
  const { id } = useParams()
  return (
    <div className="min-h-[60vh] p-6">
      <div className="mb-4 flex items-center gap-2">
        <img src="/logo-kw-120.png" alt="Financeiro KW" className="h-7 w-7 rounded" loading="lazy" />
        <h1 className="text-2xl font-bold">Competência</h1>
      </div>
      <p className="opacity-70">Detalhes e lançamentos para a competência #{id}.</p>
    </div>
  )
}

export default CompetenciaView
