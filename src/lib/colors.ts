// Utilitário de cores para categorias e sections

// Paleta sóbria: tons moderados para evitar "carnaval"
// Paleta vibrante: alta saturação e variedade de matizes
const baseColors = [
  '#ff3e2f', // vermelho vivo
  '#ff6d00', // laranja queimado
  '#ffa801', // amarelo forte
  '#ffd60a', // amarelo claro
  '#74d600', // verde limão
  '#2ecc71', // verde esmeralda
  '#00b4d8', // azul caribe
  '#0077b6', // azul intenso
  '#4361ee', // azul violeta
  '#7209b7', // roxo vibrante
  '#b5179e', // magenta
  '#ff4d6d'  // rosa avermelhado
]

// Overrides explícitos para identidade fixa de algumas categorias
// Ex: "noiva" sempre vermelho.
const categoryColorOverrides: Record<string, string> = {
  'noiva': '#e63946' // vermelho identidade
}

export function getCategoryColor(name: string): string {
  if (!name) return '#8884d8'
  const normalized = normalizeKey(name)
  if (categoryColorOverrides[normalized]) return categoryColorOverrides[normalized]
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

// =========================
// Cores determinísticas por ID
// =========================
// Gera uma cor estável a partir de um ID (string ou número) usando hashing simples.
// Estratégia: converte hash em hue (0-360) e fixa saturação/luminosidade para consistência visual.
// Produz variação suficiente sem ficar "aleatório" entre execuções.
export function getColorForId(id: string | number): string {
  const key = normalizeKey(String(id))
  const hash = fnv1aHash(key)
  const hue = hash % 360
  // Saturação mais alta e lightness médio para cores vivas, ainda legíveis.
  const saturation = 70
  const lightness = 50
  return hslToHex(hue, saturation, lightness)
}

// Permite acessar internamente caso queira testar ou ajustar heurística.
function fnv1aHash(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = (h * 0x01000193) >>> 0
  }
  return h
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const color = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

// Normaliza chaves removendo acentos e transformando em minúsculas.
function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

// Caso queira expor overrides para ajuste em runtime.
export function setCategoryOverride(key: string, color: string) {
  categoryColorOverrides[normalizeKey(key)] = color
}

