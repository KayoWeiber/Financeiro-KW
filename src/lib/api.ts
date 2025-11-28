const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || ''

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
}

async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!BASE_URL) throw new Error('VITE_API_BASE_URL não configurada no .env')

  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  })

  if (options.method === 'DELETE') {
    if (!res.ok && res.status !== 204) throw new Error(`Erro ${res.status} em ${url}`)
    return undefined as unknown as T
  }

  if (!res.ok) throw new Error(`Erro ${res.status} em ${url}`)

  // Tenta JSON; se falhar, retorna texto (ex.: healthcheck)
  const text = await res.text()
  try {
    return JSON.parse(text) as T
  } catch {
    return text as unknown as T
  }
}

export const api = {
  // Healthcheck retorna string "API Financeira Online"
  health: () => request<string>('/'),

  // Categorias
  createCategoria: (payload: { user_id: number | string; nome: string }) =>
    request('/categorias', { method: 'POST', body: payload }),
  getCategorias: (userId: number | string) => request(`/categorias/${userId}`),
  updateCategoria: (id: number | string, payload: { nome: string }) =>
    request(`/categorias/${id}`, { method: 'PATCH', body: payload }),
  deleteCategoria: (id: number | string) => request(`/categorias/${id}`, { method: 'DELETE' }),

  // Competências
  createCompetencia: (payload: { user_id: number | string; ano: number; mes: number; ativa: boolean }) =>
    request('/competencias', { method: 'POST', body: payload }),
  getCompetencias: (userId: number | string) => request(`/competencias/${userId}`),
  updateCompetencia: (id: number | string, payload: { ativa: boolean }) =>
    request(`/competencias/${id}`, { method: 'PATCH', body: payload }),
  deleteCompetencia: (id: number | string) => request(`/competencias/${id}`, { method: 'DELETE' }),

  // Entradas
  createEntrada: (payload: {
    user_id: number | string
    competencia_id: number | string
    data: string
    tipo_renda: string
    descricao: string
    valor: number
  }) => request('/entradas', { method: 'POST', body: payload }),
  getEntradas: (competenciaId: number | string) => request(`/entradas/${competenciaId}`),

  // Formas de pagamento
  createFormaPagamento: (payload: { user_id: number | string; tipo: string }) =>
    request('/formas-pagamento', { method: 'POST', body: payload }),
  getFormasPagamento: (userId: number | string) => request(`/formas-pagamento/${userId}`),
  updateFormaPagamento: (id: number | string, payload: { tipo: string }) =>
    request(`/formas-pagamento/${id}`, { method: 'PATCH', body: payload }),
  deleteFormaPagamento: (id: number | string) => request(`/formas-pagamento/${id}`, { method: 'DELETE' }),

  // Gastos variáveis
  createGastoVariavel: (payload: {
    user_id: number | string
    competencia_id: number | string
    categoria_id: number | string
    forma_pagamento_id: number | string
    data: string
    descricao: string
    valor: number
  }) => request('/gastos-variaveis', { method: 'POST', body: payload }),
  getGastosVariaveis: (competenciaId: number | string) => request(`/gastos-variaveis/${competenciaId}`),
  updateGastoVariavel: (
    id: number | string,
    payload: { data: string; descricao: string; valor: number }
  ) => request(`/gastos-variaveis/${id}`, { method: 'PATCH', body: payload }),
  deleteGastoVariavel: (id: number | string) => request(`/gastos-variaveis/${id}`, { method: 'DELETE' }),

  // Investimentos
  createInvestimento: (payload: {
    user_id: number | string
    competencia_id: number | string
    data: string
    descricao: string
    valor: number
  }) => request('/investimentos', { method: 'POST', body: payload }),
  getInvestimentos: (competenciaId: number | string) => request(`/investimentos/${competenciaId}`)
}

export type ApiClient = typeof api
