import { useEffect, useState } from 'react'
const API=(import.meta.env.VITE_API_URL||'http://localhost:8080').replace(/\/$/,'')
const JOB='legal-analyzer:active-job-id'
type X={status:string;idadeDias?:number|null;duracaoMediaDias?:number|null;percentualDuracao?:number|null;probabilidadeAcordo?:number|null;probabilidadePericia?:number|null;congestionamento?:number|null;mensagem:string;fonte?:string|null}
export default function DataJudInsightsOverlay(){
 const [id,setId]=useState<string|null>(null); const [x,setX]=useState<X|null>(null)
 useEffect(()=>{const f=()=>setId(localStorage.getItem(JOB));f();const t=setInterval(f,1000);return()=>clearInterval(t)},[])
 useEffect(()=>{if(!id){setX(null);return};let stop=false;const f=async()=>{try{const r=await fetch(`${API}/api/v1/processos/analises/${id}/datajud/insights`);if(r.ok&&!stop)setX(await r.json())}catch{}};f();const t=setInterval(f,5000);return()=>{stop=true;clearInterval(t)}},[id])
 if(!x||x.status==='NAO_DISPONIVEL')return null
 const v=(n?:number|null)=>n==null?'—':`${n}%`
 return <div className="datajud-insights"><b>Radar estatístico DataJud</b><div>Idade: {x.idadeDias??'—'} dias</div><div>Média: {x.duracaoMediaDias??'—'} dias</div><div>Andamento relativo: {v(x.percentualDuracao)}</div><div>Acordo: {v(x.probabilidadeAcordo)}</div><div>Perícia: {v(x.probabilidadePericia)}</div><div>Congestionamento: {v(x.congestionamento)}</div><small>{x.mensagem}</small>{x.fonte&&<small>Fonte: {x.fonte}</small>}</div>
}
