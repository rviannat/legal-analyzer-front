import { API } from './api'

async function parse<T = any>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || body.error || `Erro HTTP ${response.status}`)
  return body
}

export const backendApi = {
  url: (path: string) => `${API}${path}`,
  upload: async (file: File) => {
    const form = new FormData()
    form.append('arquivo', file)
    return parse(await fetch(`${API}/api/v1/processos/analisar`, { method: 'POST', body: form }))
  },
  analysis: async (id: string) => parse(await fetch(`${API}/api/v1/processos/analises/${id}`)),
  dataJud: async (id: string) => parse(await fetch(`${API}/api/v1/processos/analises/${id}/datajud`)),
  audit: async (id: string) => parse(await fetch(`${API}/api/v1/processos/analises/${id}/datajud/auditoria`)),
  timeline: async (id: string) => parse(await fetch(`${API}/api/v1/processos/analises/${id}/datajud/timeline`)),
  insights: async (id: string) => parse(await fetch(`${API}/api/v1/processos/analises/${id}/datajud/insights`)),
}
