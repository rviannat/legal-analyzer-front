const API=(import.meta.env.VITE_API_URL||'http://localhost:8080').replace(/\/$/,'')
const KEY='legal-analyzer:active-job-id'

type Timeline={movimentacoesOficiais:number;eventosPdf:number;correspondencias:number;movimentacoesOcultas:number;linhaDoTempoHibrida:any[];alertasMovimentacoesOcultas:any[];dataPublicacaoOficial?:string|null;dataTransitoEmJulgadoOficial?:string|null;observacao:string}

export function installDataJudTimelineOverlay(){
 const render=(t:Timeline|null)=>{let el=document.getElementById('datajud-timeline-overlay');if(!el){el=document.createElement('section');el.id='datajud-timeline-overlay';document.querySelector('main')?.appendChild(el)};if(!t||!t.movimentacoesOficiais){el.innerHTML='';return};const alerts=t.alertasMovimentacoesOcultas||[];el.innerHTML=`<div class="datajud-timeline-head"><b>Timeline híbrida · PDF + DataJud</b><span>${t.movimentacoesOficiais} oficiais · ${t.correspondencias} correspondentes</span></div>${alerts.length?`<div class="datajud-timeline-alert"><b>⚠ ${alerts.length} movimentação(ões) sem correspondente claro no PDF</b>${alerts.slice(0,5).map((x:any)=>`<div>${x.data||'—'} — ${x.descricao||'Movimentação oficial'}</div>`).join('')}</div>`:''}<div class="datajud-timeline-meta">${t.dataPublicacaoOficial?`<span><b>Publicação oficial</b> ${t.dataPublicacaoOficial}</span>`:''}${t.dataTransitoEmJulgadoOficial?`<span><b>Trânsito em julgado</b> ${t.dataTransitoEmJulgadoOficial}</span>`:''}</div><small>${t.observacao||''}</small>`}
 const poll=async()=>{const id=localStorage.getItem(KEY);if(!id)return;try{const r=await fetch(`${API}/api/v1/processos/analises/${id}/datajud/timeline`);if(r.ok)render(await r.json())}catch{}}
 poll();window.setInterval(poll,3000)
}
