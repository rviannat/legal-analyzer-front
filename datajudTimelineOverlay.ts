const API=(import.meta.env.VITE_API_URL||'http://localhost:8080').replace(/\/$/,'')
const KEY='legal-analyzer:active-job-id'

type Timeline={movimentacoesOficiais:number;eventosPdf:number;correspondencias:number;movimentacoesOcultas:number;linhaDoTempoHibrida:any[];alertasMovimentacoesOcultas:any[];alertasPrazos?:any[];dataPublicacaoOficial?:string|null;dataTransitoEmJulgadoOficial?:string|null;observacao:string}
type Audit={capaEnriquecida:boolean;camposEnriquecidos:string[];validacaoPartesStatus:string;divergencias:string[];observacao:string;dataJud?:{tribunal?:string|null;grau?:string|null;classeProcessual?:string|null;orgaoJulgador?:string|null;encontrado?:boolean}}

function esc(value:any){return String(value??'').replace(/[&<>\"]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c))}

export function installDataJudTimelineOverlay(){
 const render=(t:Timeline|null,a:Audit|null)=>{
   let el=document.getElementById('datajud-timeline-overlay');
   if(!el){el=document.createElement('section');el.id='datajud-timeline-overlay';document.querySelector('main')?.appendChild(el)}
   if(!t&&!a){el.innerHTML='';return}
   const alerts=t?.alertasMovimentacoesOcultas||[]
   const prazo=t?.alertasPrazos||[]
   const divergencias=a?.divergencias||[]
   el.innerHTML=`
   <div class="datajud-timeline-head"><b>Auditoria oficial · DataJud</b><span>${a?.capaEnriquecida?'Capa enriquecida':'Consulta oficial'} · ${t?.movimentacoesOficiais||0} movimentações</span></div>
   ${a?.capaEnriquecida?`<div class="datajud-audit-grid"><span><b>${esc(a.dataJud?.tribunal||'—')}</b><small>Tribunal oficial</small></span><span><b>${esc(a.dataJud?.grau||'—')}</b><small>Grau</small></span><span><b>${esc(a.dataJud?.classeProcessual||'—')}</b><small>Classe oficial</small></span><span><b>${esc(a.dataJud?.orgaoJulgador||'—')}</b><small>Órgão julgador</small></span></div>`:''}
   ${a?.camposEnriquecidos?.length?`<div class="datajud-audit-fields"><b>Metadados confirmados pelo DataJud</b><span>${a.camposEnriquecidos.map(esc).join(' · ')}</span></div>`:''}
   ${divergencias.length?`<div class="datajud-timeline-alert danger"><b>⚠ ${divergencias.length} divergência(s) detectada(s)</b>${divergencias.slice(0,5).map((x:any)=>`<div>${esc(x)}</div>`).join('')}</div>`:''}
   ${alerts.length?`<div class="datajud-timeline-alert"><b>⚠ ${alerts.length} movimentação(ões) sem correspondente claro no PDF</b>${alerts.slice(0,5).map((x:any)=>`<div>${esc(x.data||'—')} — ${esc(x.descricao||'Movimentação oficial')}</div>`).join('')}</div>`:''}
   ${prazo.length?`<div class="datajud-timeline-alert prazo"><b>⏱ ${prazo.length} possível(is) gerador(es) de prazo</b>${prazo.slice(0,5).map((x:any)=>`<div>${esc(x.data||'—')} — ${esc(x.descricao||x.fase||'Verificar ato oficial')}</div>`).join('')}<small>O sistema não presume automaticamente o número de dias do prazo.</small></div>`:''}
   ${t?`<div class="datajud-timeline-meta"><span><b>Correspondências</b> ${t.correspondencias}/${t.movimentacoesOficiais}</span>${t.dataPublicacaoOficial?`<span><b>Publicação oficial</b> ${esc(t.dataPublicacaoOficial)}</span>`:''}${t.dataTransitoEmJulgadoOficial?`<span><b>Trânsito em julgado</b> ${esc(t.dataTransitoEmJulgadoOficial)}</span>`:''}</div>`:''}
   <small>${esc(a?.observacao||t?.observacao||'')}</small>`
 }
 const poll=async()=>{const id=localStorage.getItem(KEY);if(!id)return;try{const [tr,ar]=await Promise.all([fetch(`${API}/api/v1/processos/analises/${id}/datajud/timeline`),fetch(`${API}/api/v1/processos/analises/${id}/datajud/auditoria`)]);const t=tr.ok?await tr.json():null;const a=ar.ok?await ar.json():null;render(t,a)}catch{}}
 poll();window.setInterval(poll,3000)
}
