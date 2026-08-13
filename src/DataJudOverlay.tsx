import { useEffect, useState } from 'react'
import { CheckCircle2, Clock3, ExternalLink, Loader2, ShieldCheck, XCircle } from 'lucide-react'
import { getDataJud, type DataJudInfo } from './api'

const ACTIVE_JOB_KEY = 'legal-analyzer:active-job-id'

export default function DataJudOverlay(){
  const [jobId,setJobId]=useState<string|null>(null)
  const [info,setInfo]=useState<DataJudInfo|null>(null)

  useEffect(()=>{
    const sync=()=>setJobId(localStorage.getItem(ACTIVE_JOB_KEY))
    sync(); const timer=window.setInterval(sync,1000)
    return ()=>window.clearInterval(timer)
  },[])

  useEffect(()=>{
    if(!jobId){setInfo(null);return}
    let cancelled=false
    const poll=async()=>{try{const next=await getDataJud(jobId);if(!cancelled)setInfo(next)}catch{} }
    poll(); const timer=window.setInterval(poll,2500)
    return ()=>{cancelled=true;window.clearInterval(timer)}
  },[jobId])

  if(!jobId || !info || info.status==='NAO_CONFIGURADO') return null

  const running=info.status==='AGUARDANDO'||info.status==='CONSULTANDO'
  const ok=info.status==='ENCONTRADO'
  const notFound=info.status==='NAO_ENCONTRADO'
  const unavailable=info.status==='INDISPONIVEL'||info.status==='NUMERO_NAO_IDENTIFICADO'
  const Icon=running?Loader2:ok?CheckCircle2:notFound?XCircle:ShieldCheck

  return <div className="datajud-overlay" role="status">
    <div className="datajud-head">
      <div className="datajud-title"><span className={`datajud-icon ${running?'running':ok?'ok':unavailable?'warning':''}`}><Icon size={17} className={running?'spin':''}/></span><div><b>Auditoria DataJud / CNJ</b><small>{running?'Consulta oficial em andamento':'Validação da base pública concluída'}</small></div></div>
      {info.endpoint && <a href={info.endpoint} target="_blank" rel="noreferrer" title="Abrir endpoint DataJud"><ExternalLink size={15}/></a>}
    </div>
    <div className="datajud-number">{info.numeroProcesso}</div>
    <div className="datajud-message">{info.mensagem}</div>
    {ok && <div className="datajud-grid"><span><b>{info.tribunal?.toUpperCase()||'—'}</b><small>Tribunal</small></span><span><b>{info.quantidadeMovimentos??0}</b><small>Movimentações</small></span><span><b>{info.grau||'—'}</b><small>Grau</small></span></div>}
    {ok && <div className="datajud-last"><Clock3 size={14}/><span><b>Última movimentação</b>{info.ultimaMovimentacao||'Não informado'}</span></div>}
  </div>
}
