// Utilitário de cores para categorias e sections

// Paleta sóbria: tons moderados para evitar "carnaval"
const baseColors = [
  '#4361ee', // azul brand
  '#4895ef', // azul claro
  '#4cc9f0', // azul aqua suave
  '#3f72af', // azul acinzentado
  '#64a6bd', // teal suave
  '#89b0ae', // cinza verde
  '#b8c1ec', // lavanda clara
  '#a5b4c3', // cinza azulado claro
  '#adb5bd', // cinza neutro
  '#6c757d', // cinza médio
  '#495057', // cinza escuro
  '#2d4059'  // quase azul escuro
]

export function getCategoryColor(name: string): string {
  if (!name) return '#8884d8'
  const normalized = name.toLowerCase()
  const hash = Array.from(normalized).reduce((acc, ch) => acc + ch.charCodeAt(0) * 17, 0)
  const idx = hash % baseColors.length
  return baseColors[idx]
}

// Gradientes sutis para sections (não brancos, mas discretos)
export const sectionGradients = [
  'linear-gradient(135deg,#f5f7fa,#e4ebf3)',
  'linear-gradient(135deg,#f6f9fc,#e9eef5)',
  'linear-gradient(135deg,#eef2f7,#dde4ec)'
]

export function gradientFor(title: string): string {
  const hash = Array.from(title).reduce((acc, ch) => acc + ch.charCodeAt(0) * 13, 0)
  return sectionGradients[hash % sectionGradients.length]
}
