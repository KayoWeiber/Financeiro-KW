import React from 'react'
import { useParams } from 'react-router-dom'

const CompetenciaView: React.FC = () => {
  const { id } = useParams()
  return (
    <div className="min-h-[60vh] p-6">
      <h1 className="text-2xl font-bold mb-2">Competência</h1>
      <p className="opacity-70">Detalhes e lançamentos para a competência #{id}.</p>
    </div>
  )
}

export default CompetenciaView
