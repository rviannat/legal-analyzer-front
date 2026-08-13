export const API = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '')

export type DataJudInfo = {
  status: 'NAO_CONFIGURADO'|'AGUARDANDO'|'CONSULTANDO'|'ENCONTRADO'|'NAO_ENCONTRADO'|'INDISPONIVEL'|'NUMERO_NAO_IDENTIFICADO'
  numeroProcesso: string; tribunal?: string|null; endpoint?: string|null; encontrado: boolean
  quantidadeMovimentos?: number|null; ultimaMovimentacao?: string|null; classeProcessual?: string|null
  orgaoJulgador?: string|null; grau?: string|null; mensagem: string; consultadoEm?: string|null
}
export type DataJudAuditoria = {
  dataJud: DataJudInfo
  capaEnriquecida: boolean
  camposEnriquecidos: string[]
  validacaoPartesStatus: 'NAO_DISPONIVEL_NA_API_PUBLICA'|'NAO_CONCLUSIVA'|string
  partesExtraidas: any[]
  divergencias: string[]
  observacao: string
}
export type Job = { id: string; nomeArquivo: string; status: string; progresso: number; etapa: string; mensagem: string; criadoEm: string; atualizadoEm: string; resultado?: AnalysisResult | null; analiseEspecializada?: unknown; dataJud?: DataJudInfo|null }
export type AnalysisResult = { metadata?: any; partes?: any[]; cronologia?: any[]; pedidos?: any[]; decisoes?: any[]; prazos?: any[]; documentosImportantes?: any[]; resumoProcesso?: string; inconsistencias?: any[]; gruposEvidencia?: any[]; perguntasInvestigacao?: string[]; relatorioExecutivo?: any; analiseEspecializada?: any }
export type Briefing = { analiseId: string; numeroProcesso: string; nomeArquivo: string; geradoEm: string; partes: any[]; situacao?: any; linhaDoTempo: any[]; pontosAtencao: any[]; evidencias: any[]; perguntasParaOAdvogado: any[]; avisos: string[]; markdown: string }
export type ChatResponse = { sessaoId: string; pergunta: string; resposta: string; citacoes: any[]; fundamentada: boolean; modoRecuperacao: string; perguntasSugeridas: string[]; aviso: string }

async function parse<T>(r: Response): Promise<T> { const body = await r.json().catch(() => ({})); if (!r.ok) throw new Error(body.message || body.error || `Erro HTTP ${r.status}`); return body }
export async function uploadPdf(file: File) { const fd = new FormData(); fd.append('arquivo', file); return parse<Job>(await fetch(`${API}/api/v1/processos/analisar`, {method:'POST', body:fd})) }
export async function getJob(id: string) { return parse<Job>(await fetch(`${API}/api/v1/processos/analises/${id}`)) }
export async function getDataJud(id: string) { return parse<DataJudInfo>(await fetch(`${API}/api/v1/processos/analises/${id}/datajud`)) }
export async function getDataJudAuditoria(id: string) { return parse<DataJudAuditoria>(await fetch(`${API}/api/v1/processos/analises/${id}/datajud/auditoria`)) }
export async function getBriefing(id: string) { return parse<Briefing>(await fetch(`${API}/api/v1/processos/analises/${id}/briefing`)) }
export async function askProcess(id: string, pergunta: string, sessaoId?: string) { return parse<ChatResponse>(await fetch(`${API}/api/v1/processos/analises/${id}/chat`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({pergunta, ...(sessaoId ? {sessaoId}: {})})})) }
export async function startSpecialized(id: string, payload: any = {}) { return parse<any>(await fetch(`${API}/api/v1/processos/analises/${id}/especializada`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)})) }
export async function getSpecialized(id: string) { return parse<any>(await fetch(`${API}/api/v1/processos/analises-especializadas/${id}`)) }
