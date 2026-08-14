export const API = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '')

export type Job = {
  id: string; nomeArquivo: string; status: string; progresso: number; etapa: string;
  mensagem: string; criadoEm: string; atualizadoEm: string; resultado?: AnalysisResult | null;
  analiseEspecializada?: unknown
}
export type AnalysisResult = {
  metadata?: any; partes?: any[]; cronologia?: any[]; pedidos?: any[]; decisoes?: any[];
  prazos?: any[]; documentosImportantes?: any[]; resumoProcesso?: string;
  inconsistencias?: any[]; gruposEvidencia?: any[]; perguntasInvestigacao?: string[];
  relatorioExecutivo?: any; analiseEspecializada?: any
}
export type Briefing = {
  analiseId: string; numeroProcesso: string; nomeArquivo: string; geradoEm: string;
  partes: any[]; situacao?: any; linhaDoTempo: any[]; pontosAtencao: any[];
  evidencias: any[]; perguntasParaOAdvogado: any[]; avisos: string[]; markdown: string
}
export type ChatResponse = {
  sessaoId: string; pergunta: string; resposta: string; citacoes: any[];
  fundamentada: boolean; modoRecuperacao: string; perguntasSugeridas: string[]; aviso: string
}
export type SearchCriteria = { cpf?: string; cnpj?: string; nome?: string; numeroCnj?: string }
export type ProcessoEncontrado = {
  id: string; numeroCnj?: string; tribunal?: string; classe?: string; assunto?: string;
  situacao?: string; dataDistribuicao?: string; partes?: any[]
}

async function parse<T>(r: Response): Promise<T> {
  const body = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(body.message || body.error || `Erro HTTP ${r.status}`)
  return body
}
export async function uploadPdf(file: File) {
  const fd = new FormData(); fd.append('arquivo', file)
  return parse<Job>(await fetch(`${API}/api/v1/processos/analisar`, {method:'POST', body:fd}))
}
export async function getJob(id: string) {
  return parse<Job>(await fetch(`${API}/api/v1/processos/analises/${id}`))
}
export async function getBriefing(id: string) {
  return parse<Briefing>(await fetch(`${API}/api/v1/processos/analises/${id}/briefing`))
}
export async function askProcess(id: string, pergunta: string, sessaoId?: string) {
  return parse<ChatResponse>(await fetch(`${API}/api/v1/processos/analises/${id}/chat`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({pergunta, ...(sessaoId ? {sessaoId}: {})})
  }))
}
export async function startSpecialized(id: string, payload: any = {}) {
  return parse<any>(await fetch(`${API}/api/v1/processos/analises/${id}/especializada`, {
    method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
  }))
}
export async function getSpecialized(id: string) {
  return parse<any>(await fetch(`${API}/api/v1/processos/analises-especializadas/${id}`))
}

// ATENÇÃO: endpoints de pesquisa assumidos (o backend ainda não os expunha em api.ts).
// Ajuste os paths abaixo para o contrato real assim que o endpoint existir no legal-analyzer.
export async function pesquisarProcessos(criteria: SearchCriteria) {
  const params = new URLSearchParams()
  if (criteria.cpf) params.set('cpf', criteria.cpf)
  if (criteria.cnpj) params.set('cnpj', criteria.cnpj)
  if (criteria.nome) params.set('nome', criteria.nome)
  if (criteria.numeroCnj) params.set('numeroCnj', criteria.numeroCnj)
  return parse<ProcessoEncontrado[]>(await fetch(`${API}/api/v1/processos/pesquisar?${params.toString()}`))
}
// Deve iniciar o mesmo fluxo assíncrono do upload (mesma forma de Job) para o processo encontrado.
export async function analisarProcessoEncontrado(id: string) {
  return parse<Job>(await fetch(`${API}/api/v1/processos/pesquisar/${id}/analisar`, { method: 'POST' }))
}