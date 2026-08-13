import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock3, ExternalLink, Loader2, Search, ShieldCheck, XCircle } from 'lucide-react'
import { getDataJud, type DataJudInfo } from './api'

const API=(import.meta.env.VITE_API_URL||'http://localhost:8080').replace(/\/$/,'')
const ACTIVE_JOB_KEY='legal-analyzer:active-job-id'

type Timeline={alertasPrazos:any[];alertasMovimentacoesOcultas:any[];movimentacoesOcultas:number;observacao:string;dataPublicacaoOficial?:string|null;dataTransitoEmJulgadoOficial?:string|null}
type SearchResult={executada:boolean;mensagem:string;tribunal?:string;assunto?:string;processo?:DataJudInfo|null;amostra:any[];totalAmostra:number}

async function json<T>(r:Response):Promise<T>{const b=await r.json().catch(()=>({}));if(!r.ok)throw new Error(b.message||b.error||`HTTP ${r.status}`);return b}

export default function DataJudOverlay(){
  const [jobId,setJobId]=useState<string|null>(null)
  const [info,setInfo]=useState<DataJudInfo|null>(null)
  const [timeline,setTimeline]=useState<Timeline|null>(null)
  const [cnj,setCnj]=useState('')
  const [tribunal,setTribunal]=useState('tjsp')
  const [assunto,setAssunto]=useState('')
  const [searching,setSearching]=useState(false)
  const [search,setSearch]=useState<SearchResult|null>(null)
  const [error,setError]=useState('')

  useEffect(()=>{const sync=()=>setJobId(localStorage.getItem(ACTIVE_JOB_KEY));sync();const t=window.setInterval(sync,1000);return()=>window.clearInterval(t)},[])
  useEffect(()=>{if(!jobId){setInfo(null);setTimeline(null);return};let cancelled=false;const poll=async()=>{try{const [next,t]=await Promise.all([getDataJud(jobId),json<Timeline>(fetch(`${API}/api/v1/processos/analises/${jobId}/datajud/timeline`))]);if(!cancelled){setInfo(next);setTimeline(t)}}catch{} };poll();const t=window.setInterval(poll,2500);return()=>{cancelled=true;window.clearInterval(t)}},[jobId])

  async function pesquisarCnj(){
    if(!cnj.trim()) return
    setSearching(true);setError('');setSearch(null)
    try{setSearch(await json<SearchResult>(await fetch(`${API}/api/v1/datajud/processos/cnj?numeroProcesso=${encodeURIComponent(cnj)}`,{method:'POST'})))}catch(e:any){setError(e.message||'Falha na consulta CNJ.')}finally{setSearching(false)}
  }
  async function pesquisarAmostra(){
    if(!tribunal.trim()||!assunto.trim()) return
    setSearching(true);setError('');setSearch(null)
    try{setSearch(await json<SearchResult>(await fetch(`${API}/api/v1/datajud/processos/amostra?codigoTribunal=${encodeURIComponent(tribunal)}&assunto=${encodeURIComponent(assunto)}&tamanho=8`)))}catch(e:any){setError(e.message||'Falha na pesquisa DataJud.')}finally{setSearching(false)}
  }

  const running=info?.status==='AGUARDANDO'||info?.status==='CONSULTANDO'
  const ok=info?.status==='ENCONTRADO'
  const notFound=info?.status==='NAO_ENCONTRADO'
  const unavailable=info?.status==='INDISPONIVEL'||info?.status==='NUMERO_NAO_IDENTIFICADO'
  const Icon=running?Loader2:ok?CheckCircle2:notFound?XCircle:ShieldCheck
  const alerts=(timeline?.alertasPrazos||[])
  const hidden=(timeline?.alertasMovimentacoesOcultas||[])

  return <div className="datajud-overlay datajud-workspace">
    <div className="datajud-head"><div className="datajud-title"><span className={`datajud-icon ${running?'running':ok?'ok':unavailable?'warning':''}`}><Icon size={17} className={running?'spin':''}/></span><div><b>DataJud / CNJ</b><small>Pesquisa, auditoria e inteligência oficial</small></div></div>{info?.endpoint&&<a href={info.endpoint} target="_blank" rel="noreferrer"><ExternalLink size={15}/></a>}</div>

    <div className="datajud-search-block"><div className="datajud-search-title"><Search size={15}/> Pesquisar processo por CNJ</div><div className="datajud-search-row"><input value={cnj} onChange={e=>setCnj(e.target.value)} placeholder="0000000-00.0000.0.00.0000" onKeyDown={e=>e.key==='Enter'&&pesquisarCnj()}/><button onClick={pesquisarCnj} disabled={searching}>{searching?<Loader2 className="spin" size={15}/>:<Search size={15}/>}</button></div></div>
    <div className="datajud-search-block"><div className="datajud-search-title"><Search size={15}/> Pesquisa por tribunal + assunto TPU</div><div className="datajud-search-row"><input value={tribunal} onChange={e=>setTribunal(e.target.value)} placeholder="tjsp"/><input value={assunto} onChange={e=>setAssunto(e.target.value)} placeholder="código ou assunto"/><button onClick={pesquisarAmostra} disabled={searching}>{searching?<Loader2 className="spin" size={15}/>:<Search size={15}/>}</button></div></div>

    {error&&<div className="datajud-error"><AlertTriangle size={14}/>{error}</div>}
    {search&&<div className="datajud-search-result"><b>{search.executada?'Consulta concluída':'Consulta não executada'}</b><span>{search.mensagem}</span>{search.processo&&<div className="datajud-result-grid"><span><b>{search.processo.tribunal?.toUpperCase()||'—'}</b><small>Tribunal</small></span><span><b>{search.processo.classeProcessual||'—'}</b><small>Classe</small></span><span><b>{search.processo.orgaoJulgador||'—'}</b><small>Órgão</small></span></div>}{search.amostra?.length>0&&<div className="datajud-sample-list">{search.amostra.map((p,i)=><div key={i}><b>{p.numeroProcesso||'Processo'}</b><span>{p.classeNome||'Classe não informada'} · {p.orgaoJulgador||'Órgão não informado'}</span>{p.possuiMovimentoDeBaixa&&<em>encerramento detectado</em>}</div>)}</div>}</div>}

    {jobId&&info&&<><div className="datajud-number">{info.numeroProcesso}</div><div className="datajud-message">{info.mensagem}</div>{ok&&<div className="datajud-grid"><span><b>{info.tribunal?.toUpperCase()||'—'}</b><small>Tribunal</small></span><span><b>{info.quantidadeMovimentos??0}</b><small>Movimentações</small></span><span><b>{info.grau||'—'}</b><small>Grau</small></span></div>}{ok&&<div className="datajud-last"><Clock3 size={14}/><span><b>Última movimentação</b>{info.ultimaMovimentacao||'Não informado'}</span></div>}
      {(alerts.length>0||hidden.length>0)&&<div className="datajud-alerts"><div className="datajud-alerts-head"><b><AlertTriangle size={15}/> Pontos de atenção DataJud</b><span>{alerts.length+hidden.length}</span></div>{alerts.slice(0,4).map((a,i)=><div className="datajud-alert high" key={`p${i}`}><strong>⚠ Possível prazo</strong><span>{a.descricao||a.fase||'Movimentação potencialmente geradora de prazo'}</span><small>Verifique o ato oficial antes de considerar o prazo iniciado.</small></div>)}{hidden.slice(0,4).map((a,i)=><div className="datajud-alert medium" key={`h${i}`}><strong>Movimentação fora do PDF</strong><span>{a.descricao||'Evento oficial sem correspondência clara no documento'}</span></div>)}</div>}
      {timeline&&<div className="datajud-footnote">{timeline.dataPublicacaoOficial&&<>Publicação oficial: <b>{timeline.dataPublicacaoOficial}</b> · </>}{timeline.dataTransitoEmJulgadoOficial&&<>Trânsito: <b>{timeline.dataTransitoEmJulgadoOficial}</b></>} {timeline.movimentacoesOcultas>0&&<span> · {timeline.movimentacoesOcultas} lacuna(s) de correspondência</span>}</div>}</>}
  </div>
}
