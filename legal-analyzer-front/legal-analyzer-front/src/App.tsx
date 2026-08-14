import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  AlertTriangle, ArrowLeft, Bot, CalendarDays, CheckCircle2, ChevronRight,
  Clock3, FileText, FolderOpen, HelpCircle, Info, Loader2, MessageSquare,
  Plus, Scale, Search, Send, ShieldCheck, Sparkles, UploadCloud,
  Users, X, Zap
} from 'lucide-react'
import {
  analisarProcessoEncontrado, askProcess, getBriefing, getJob, getSpecialized, pesquisarProcessos,
  startSpecialized, uploadPdf, type Briefing, type Job, type ProcessoEncontrado, type SearchCriteria
} from './api'

type View = 'home' | 'processing' | 'case' | 'search'
type ChatMsg = { role:'user'|'assistant'; text:string; citations?:any[] }
type RecentJob = { id:string; nomeArquivo:string; status:string; progresso:number; etapa:string; mensagem:string; atualizadoEm?:string; savedAt:string }

const ACTIVE_JOB_KEY = 'legal-analyzer:active-job-id'
const RECENT_JOBS_KEY = 'legal-analyzer:recent-jobs'
const MAX_RECENT_JOBS = 8

const stages = [
  ['EXTRAINDO_PDF','Extraindo PDF'], ['ANALISANDO_PARTES','Analisando partes'],
  ['CONSOLIDANDO','Consolidando evidências'], ['ANALISANDO_EVIDENCIAS','Analisando evidências'],
  ['GERANDO_RELATORIO','Gerando relatório'], ['CONCLUIDO','Relatório pronto']
]

function toRecentJob(job:Job):RecentJob{
  return { id:job.id, nomeArquivo:job.nomeArquivo, status:job.status, progresso:job.progresso ?? 0, etapa:job.etapa || 'Processamento', mensagem:job.mensagem || '', atualizadoEm:job.atualizadoEm, savedAt:new Date().toISOString() }
}

function saveRecentJob(job:Job){
  try{
    const current:RecentJob[] = JSON.parse(localStorage.getItem(RECENT_JOBS_KEY) || '[]')
    const next=[toRecentJob(job), ...current.filter(x=>x.id!==job.id)].slice(0,MAX_RECENT_JOBS)
    localStorage.setItem(RECENT_JOBS_KEY,JSON.stringify(next))
  }catch{}
}

function loadRecentJobs():RecentJob[]{
  try{return JSON.parse(localStorage.getItem(RECENT_JOBS_KEY) || '[]')}catch{return []}
}

function App(){
  const [view,setView]=useState<View>('home')
  const [job,setJob]=useState<Job|null>(null)
  const [briefing,setBriefing]=useState<Briefing|null>(null)
  const [error,setError]=useState('')
  const [tab,setTab]=useState('overview')
  const [recentJobs,setRecentJobs]=useState<RecentJob[]>([])

  const refreshRecent=(j:Job)=>{saveRecentJob(j);setRecentJobs(loadRecentJobs())}

  async function handleUpload(file:File){
    setError('')
    try {
      const j=await uploadPdf(file)
      localStorage.setItem(ACTIVE_JOB_KEY, j.id)
      refreshRecent(j)
      setJob(j)
      setView('processing')
    }
    catch(e:any){ setError(e.message || 'Não foi possível enviar o PDF.') }
  }

  async function handleAnalyzeFound(id:string){
    setError('')
    try {
      const j=await analisarProcessoEncontrado(id)
      localStorage.setItem(ACTIVE_JOB_KEY, j.id)
      refreshRecent(j)
      setJob(j)
      setView('processing')
    }
    catch(e:any){ setError(e.message || 'Não foi possível iniciar a análise do processo encontrado.') }
  }

  async function openRecent(id:string){
    setError('')
    try{
      const savedJob=await getJob(id)
      refreshRecent(savedJob)
      setJob(savedJob)
      if(savedJob.status==='CONCLUIDO') setView('case')
      else if(savedJob.status==='ERRO') setError(savedJob.mensagem || 'O processamento foi encerrado com erro.')
      else { localStorage.setItem(ACTIVE_JOB_KEY,savedJob.id); setView('processing') }
    }catch(e:any){setError(e.message || 'Não foi possível abrir o processo.')}
  }

  useEffect(()=>{
    setRecentJobs(loadRecentJobs())
    const savedJobId = localStorage.getItem(ACTIVE_JOB_KEY)
    if(!savedJobId) return

    getJob(savedJobId)
      .then(savedJob=>{
        refreshRecent(savedJob)
        setJob(savedJob)
        if(savedJob.status==='CONCLUIDO'){
          localStorage.removeItem(ACTIVE_JOB_KEY)
          setView('case')
        } else if(savedJob.status==='ERRO'){
          localStorage.removeItem(ACTIVE_JOB_KEY)
          setError(savedJob.mensagem || 'O processamento foi encerrado com erro.')
          setView('home')
        } else {
          setView('processing')
        }
      })
      .catch(()=>localStorage.removeItem(ACTIVE_JOB_KEY))
  },[])

  useEffect(()=>{
    if(view!=='processing' || !job || ['CONCLUIDO','ERRO'].includes(job.status)) return
    const timer=setInterval(async()=>{
      try {
        const next=await getJob(job.id)
        setJob(next)
        refreshRecent(next)
        if(next.status==='CONCLUIDO'){
          localStorage.removeItem(ACTIVE_JOB_KEY)
          setView('case')
        } else if(next.status==='ERRO'){
          localStorage.removeItem(ACTIVE_JOB_KEY)
        }
      }
      catch(e:any){ setError(e.message) }
    },1500)
    return ()=>clearInterval(timer)
  },[view,job?.id,job?.status])

  useEffect(()=>{
    if(view==='case' && job && !briefing) getBriefing(job.id).then(setBriefing).catch(e=>setError(e.message))
  },[view,job?.id])

  return <div className="app">
    <Sidebar view={view} onHome={()=>{setView('home');setJob(null);setBriefing(null);setRecentJobs(loadRecentJobs())}} onCase={()=>job&&setView('case')} onSearch={()=>{setError('');setView('search')}}/>
    <main className="main">
      <Topbar job={job} onSearch={()=>{setError('');setView('search')}}/>
      {error && <div className="toast error"><AlertTriangle size={17}/>{error}<button onClick={()=>setError('')}><X size={15}/></button></div>}
      {view==='home' && <Home onUpload={handleUpload} recentJobs={recentJobs} onOpenRecent={openRecent}/>} 
      {view==='search' && <SearchView onAnalyze={handleAnalyzeFound}/>}
      {view==='processing' && job && <Processing job={job} onCancel={()=>setView('home')}/>} 
      {view==='case' && job && <CaseView job={job} briefing={briefing} tab={tab} setTab={setTab} />}
    </main>
  </div>
}

function Sidebar({view,onHome,onCase,onSearch}:{view:View,onHome:()=>void,onCase:()=>void,onSearch:()=>void}){
 return <aside className="sidebar">
   <div className="brand"><div className="brandmark"><Scale size={21}/></div><div><b>LEGAL</b><span>ANALYZER</span></div></div>
   <div className="workspace"><div className="avatar">RV</div><div><strong>Escritório</strong><small>Ambiente local</small></div><ChevronRight size={15}/></div>
   <nav>
    <button className={view==='home'?'active':''} onClick={onHome}><FolderOpen/> Processos</button>
    <button className={view==='search'?'active':''} onClick={onSearch}><Search/> Pesquisas</button>
    <button className={view==='case'?'active':''} onClick={onCase}><Sparkles/> Análise IA</button>
    <button><CalendarDays/> Prazos</button>
    <button><FileText/> Relatórios</button>
   </nav>
   <div className="sidebarBottom"><div className="privacy"><ShieldCheck size={17}/><div><b>Processamento local</b><span>Seus documentos permanecem no ambiente configurado.</span></div></div><div className="user"><div className="avatar dark">RV</div><div><strong>Rafael Vianna</strong><small>Administrador</small></div></div></div>
 </aside>
}

function Topbar({job,onSearch}:{job:Job|null,onSearch:()=>void}){
 return <header className="topbar"><div><span className="eyebrow">INTELIGÊNCIA JURÍDICA</span><h1>{job ? job.nomeArquivo : 'Painel de processos'}</h1></div><div className="top-actions"><button className="iconbtn" onClick={onSearch} title="Pesquisar processos"><Search/></button><button className="help"><HelpCircle/> Ajuda</button><div className="avatar">RV</div></div></header>
}

function Home({onUpload,recentJobs,onOpenRecent}:{onUpload:(f:File)=>void;recentJobs:RecentJob[];onOpenRecent:(id:string)=>void}){
 const input=useRef<HTMLInputElement>(null); const [drag,setDrag]=useState(false)
 const onFiles=(files:FileList|null)=>{const f=files?.[0]; if(f){ if(!f.name.toLowerCase().endsWith('.pdf')) return alert('Envie um arquivo PDF.'); onUpload(f)}}
 const processing=recentJobs.filter(x=>!['CONCLUIDO','ERRO'].includes(x.status)).length
 const completed=recentJobs.filter(x=>x.status==='CONCLUIDO').length
 return <section className="home">
   <div className="dashboardHeader">
    <div><span className="eyebrow">CENTRAL DE PROCESSOS</span><h2>Seu trabalho jurídico, <em>em um só lugar.</em></h2><p>Acompanhe análises, retome processos e inicie um novo briefing sem perder contexto.</p></div>
    <button className="primary dashboardNew" onClick={()=>input.current?.click()}><Plus size={18}/> Novo processo</button>
   </div>

   <div className="dashboardStats">
    <div className="dashboardStat"><div className="dashboardStatIcon"><FolderOpen/></div><div><strong>{recentJobs.length}</strong><span>Processos recentes</span></div></div>
    <div className="dashboardStat"><div className="dashboardStatIcon active"><Loader2/></div><div><strong>{processing}</strong><span>Em processamento</span></div></div>
    <div className="dashboardStat"><div className="dashboardStatIcon done"><CheckCircle2/></div><div><strong>{completed}</strong><span>Concluídos</span></div></div>
    <div className="dashboardStat"><div className="dashboardStatIcon"><Sparkles/></div><div><strong>IA</strong><span>Análise assistida</span></div></div>
   </div>

   <div className="dashboardGrid">
    <div className="uploadCard dashboardUpload" onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);onFiles(e.dataTransfer.files)}} data-drag={drag}>
      <input ref={input} hidden type="file" accept="application/pdf" onChange={e=>onFiles(e.target.files)}/>
      <div className="uploadIcon"><UploadCloud/></div><h3>Envie o processo em PDF</h3><p>Arraste e solte aqui ou escolha um arquivo do computador.</p>
      <button className="primary" onClick={()=>input.current?.click()}><Plus size={18}/> Analisar novo processo</button><small>PDF · análise assíncrona · documentos permanecem no ambiente configurado</small>
    </div>

    <div className="activeWorkCard">
      <div className="sectionTitle"><span><Clock3/> Atividade recente</span><small>{recentJobs.length ? `${recentJobs.length} registros` : 'Comece agora'}</small></div>
      {!recentJobs.length ? <div className="recentEmpty"><div><FileText/></div><b>Nenhum processo recente</b><p>O primeiro PDF analisado aparecerá aqui automaticamente.</p></div> :
       <div className="recentList">{recentJobs.slice(0,5).map(item=><RecentItem key={item.id} item={item} onClick={()=>onOpenRecent(item.id)}/>)}</div>}
    </div>
   </div>

   <div className="featureGrid">
    <Feature icon={<FileText/>} title="Briefing de assunção" text="Uma visão executiva para quem acabou de assumir o caso."/>
    <Feature icon={<Search/>} title="Evidências rastreadas" text="Alegação → documento → página, para conferência rápida."/>
    <Feature icon={<MessageSquare/>} title="Chat com os autos" text="Pergunte em linguagem natural e receba referências."/>
    <Feature icon={<Bot/>} title="Agentes especialistas" text="Processo, contrato, prazos, evidências, pesquisa e redação."/>
   </div>
 </section>
}

function RecentItem({item,onClick}:{item:RecentJob;onClick:()=>void}){
 const active=!['CONCLUIDO','ERRO'].includes(item.status)
 const done=item.status==='CONCLUIDO'
 const failed=item.status==='ERRO'
 return <button className="recentItem" onClick={onClick}>
   <div className={`recentIcon ${done?'done':''} ${failed?'failed':''}`}>{done?<CheckCircle2/>:failed?<AlertTriangle/>:<Loader2 className="spin"/>}</div>
   <div className="recentInfo"><b>{item.nomeArquivo}</b><span>{failed?'Falha no processamento':done?'Relatório pronto':item.etapa || 'Processando'}</span>{active&&<div className="recentProgress"><i style={{width:`${Math.max(2,Math.min(item.progresso||0,100))}%`}}/></div>}</div>
   <div className="recentMeta"><strong>{done?'100%':`${item.progresso||0}%`}</strong><ChevronRight/></div>
 </button>
}

function Feature({icon,title,text}:{icon:any,title:string,text:string}){return <div className="feature"><div className="featureIcon">{icon}</div><div><b>{title}</b><p>{text}</p></div></div>}

function SearchView({onAnalyze}:{onAnalyze:(id:string)=>Promise<void>}){
 const [cpf,setCpf]=useState(''); const [cnpj,setCnpj]=useState(''); const [nome,setNome]=useState(''); const [numeroCnj,setNumeroCnj]=useState('')
 const [results,setResults]=useState<ProcessoEncontrado[]|null>(null)
 const [loading,setLoading]=useState(false)
 const [searchError,setSearchError]=useState('')
 const [analyzingId,setAnalyzingId]=useState<string|null>(null)

 async function search(e?:FormEvent){
   e?.preventDefault()
   const criteria:SearchCriteria={cpf:cpf.trim()||undefined,cnpj:cnpj.trim()||undefined,nome:nome.trim()||undefined,numeroCnj:numeroCnj.trim()||undefined}
   if(!criteria.cpf && !criteria.cnpj && !criteria.nome && !criteria.numeroCnj){ setSearchError('Informe ao menos um critério de pesquisa.'); return }
   setSearchError(''); setLoading(true); setResults(null)
   try{ setResults(await pesquisarProcessos(criteria)) }
   catch(e:any){ setSearchError(e.message || 'Não foi possível concluir a pesquisa.') }
   finally{ setLoading(false) }
 }

 async function handleAnalyze(id:string){
   setAnalyzingId(id)
   try{ await onAnalyze(id) }
   finally{ setAnalyzingId(null) }
 }

 return <section className="search">
   <div className="dashboardHeader">
    <div><span className="eyebrow">PESQUISA DE PROCESSOS</span><h2>Encontre processos <em>direto na fonte.</em></h2><p>Pesquise por CPF, CNPJ, nome da parte ou número do processo (CNJ). Ao localizar um processo, você dispara a mesma análise usada no upload de PDF.</p></div>
   </div>

   <form className="searchForm panel" onSubmit={search}>
    <div className="searchFields">
     <label>CPF<input value={cpf} onChange={e=>setCpf(e.target.value)} placeholder="000.000.000-00"/></label>
     <label>CNPJ<input value={cnpj} onChange={e=>setCnpj(e.target.value)} placeholder="00.000.000/0000-00"/></label>
     <label>Nome da parte<input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Nome completo"/></label>
     <label>Número do processo (CNJ)<input value={numeroCnj} onChange={e=>setNumeroCnj(e.target.value)} placeholder="0000000-00.0000.0.00.0000"/></label>
    </div>
    <button className="primary" type="submit" disabled={loading}>{loading?<Loader2 className="spin"/>:<Search size={16}/>} Pesquisar</button>
   </form>

   {searchError && <div className="toast error searchError"><AlertTriangle size={17}/>{searchError}<button onClick={()=>setSearchError('')}><X size={15}/></button></div>}

   {loading && <div className="searchLoading"><Loader2 className="spin"/> Consultando a API...</div>}

   {results && !loading && (results.length
    ? <div className="searchResults">{results.map(r=>
       <div className="searchResultCard panel" key={r.id}>
        <div className="searchResultInfo">
         <span className="tag">{r.classe || 'Processo'}</span>
         <b>{r.numeroCnj || 'Número não identificado'}</b>
         <span className="searchResultMeta">{r.tribunal || ''}{r.dataDistribuicao ? ` · Distribuído em ${r.dataDistribuicao}` : ''}{r.situacao ? ` · ${r.situacao}` : ''}</span>
         {r.assunto && <p>{r.assunto}</p>}
         {!!r.partes?.length && <div className="searchResultPartes">{r.partes.slice(0,3).map((p:any,i:number)=><span key={i}>{typeof p==='string'?p:(p.nome||'Parte')}</span>)}</div>}
        </div>
        <button className="primary" onClick={()=>handleAnalyze(r.id)} disabled={analyzingId===r.id}>
         {analyzingId===r.id ? <Loader2 className="spin"/> : <Zap size={16}/>} Analisar este processo
        </button>
       </div>)}</div>
    : <div className="searchEmpty"><Info size={18}/><span>Nenhum processo encontrado para os critérios informados.</span></div>)}
 </section>
}

function Processing({job,onCancel}:{job:Job,onCancel:()=>void}){
 const foundStage = stages.findIndex(stage => stage[0] === job.status)
 const active = Math.max(0, Math.min(foundStage < 0 ? 0 : foundStage, stages.length - 1))
 const progress = Math.max(0, Math.min(job.progresso ?? 0, 100))
 return <section className="processing">
   <div className="processHead"><div><span className="eyebrow">ANÁLISE EM ANDAMENTO</span><h2>{job.nomeArquivo}</h2><p>{job.mensagem}</p></div><button className="secondary" onClick={onCancel}><ArrowLeft size={16}/> Voltar</button></div>
   <div className="progressCard"><div className="progressTop"><div><span>Progresso</span><strong>{progress}%</strong></div><div className="progressBar"><i style={{ width: `${progress}%` }} /></div></div>
    <div className="steps">{stages.map(([stageCode, label], index) => {const done=index<active||job.status==='CONCLUIDO';const current=index===active&&job.status!=='CONCLUIDO';return <div className={`step ${done?'done':''} ${current?'current':''}`} key={stageCode}><div className="stepDot">{done?<CheckCircle2 size={16}/>:current?<Loader2 size={16} className="spin"/>:<span>{index+1}</span>}</div><span>{label}</span></div>})}</div>
   </div>
   <div className="processingGrid"><div className="infoPanel"><h3><Sparkles size={18}/> O que estamos fazendo</h3><p>O documento é extraído página a página, dividido em trechos e analisado por agentes especializados. Os resultados são consolidados antes da geração do relatório.</p></div><div className="infoPanel"><h3><ShieldCheck size={18}/> Integridade da análise</h3><p>As respostas do chat e do briefing são desenhadas para apontar a origem das informações e declarar lacunas quando o material não sustenta uma conclusão.</p></div></div>
 </section>
}

function CaseView({job,briefing,tab,setTab}:{job:Job,briefing:Briefing|null,tab:string,setTab:(s:string)=>void}){
 const [chat,setChat]=useState<ChatMsg[]>([]); const [input,setInput]=useState(''); const [sending,setSending]=useState(false); const [spec,setSpec]=useState<any>(null); const [specLoading,setSpecLoading]=useState(false)
 const result=job.resultado||{}; const parts=briefing?.partes || result.partes || []; const timeline=briefing?.linhaDoTempo || result.cronologia || []; const alerts=briefing?.pontosAtencao || result.inconsistencias || []; const evidence=briefing?.evidencias || result.gruposEvidencia || []
 async function send(){if(!input.trim()||sending)return; const q=input.trim();setInput('');setChat(c=>[...c,{role:'user',text:q}]);setSending(true);try{const r=await askProcess(job.id,q);setChat(c=>[...c,{role:'assistant',text:r.resposta,citations:r.citacoes}])}catch(e:any){setChat(c=>[...c,{role:'assistant',text:'Não foi possível responder: '+e.message}])}finally{setSending(false)}}
 async function specialized(){setSpecLoading(true);try{const j=await startSpecialized(job.id,{pesquisaJuridica:false});let r=await getSpecialized(j.id);while(!['CONCLUIDO','ERRO'].includes(r.status)){await new Promise(x=>setTimeout(x,1200));r=await getSpecialized(j.id)}setSpec(r)}catch(e:any){setSpec({status:'ERRO',mensagem:e.message})}finally{setSpecLoading(false)}}
 return <section className="case"><div className="caseHero"><div><span className="eyebrow">BRIEFING DE ASSUNÇÃO</span><h2>{briefing?.numeroProcesso || 'Processo não identificado'}</h2><p>{briefing?.nomeArquivo || job.nomeArquivo}</p></div><div className="caseActions"><button className="secondary"><FileText size={16}/> Exportar</button><button className="primary" onClick={specialized} disabled={specLoading}>{specLoading?<Loader2 className="spin"/>:<Sparkles/>} Análise especializada</button></div></div>
  <div className="tabs">{[['overview','Visão geral'],['timeline','Linha do tempo'],['evidence','Evidências'],['chat','Chat com os autos']].map(([id,label])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}>{label}</button>)}</div>
  {tab==='overview' && <Overview result={result} briefing={briefing} alerts={alerts} parts={parts}/>} {tab==='timeline' && <Timeline items={timeline}/>} {tab==='evidence' && <Evidence items={evidence}/>} {tab==='chat' && <Chat chat={chat} input={input} setInput={setInput} send={send} sending={sending}/>} {spec && <SpecializedPanel spec={spec}/>}</section>
}

function Overview({result,briefing,alerts,parts}:{result:any,briefing:Briefing|null,alerts:any[],parts:any[]}){const situation=briefing?.situacao||{};const summary=situation.resumo||result.resumoProcesso||'Resumo ainda não disponível.';return <div className="overview"><div className="summaryCard"><div className="sectionTitle"><span><Sparkles/> Situação</span><small>Visão executiva</small></div><p>{summary}</p><div className="miniStats"><Stat icon={<Users/>} label="Partes" value={parts.length}/><Stat icon={<AlertTriangle/>} label="Pontos de atenção" value={alerts.length}/><Stat icon={<CalendarDays/>} label="Eventos" value={(briefing?.linhaDoTempo||result.cronologia||[]).length}/><Stat icon={<FileText/>} label="Evidências" value={(briefing?.evidencias||result.gruposEvidencia||[]).length}/></div></div><div className="twoCols"><div className="panel"><div className="sectionTitle"><span><Users/> Partes</span><small>{parts.length} identificadas</small></div>{parts.length?<div className="partyList">{parts.slice(0,8).map((p:any,i:number)=><div className="party" key={i}><div className="partyAvatar">{String(p.nome||'?').slice(0,1)}</div><div><b>{p.nome||'Não identificado'}</b><span>{p.papel||p.qualificacao||'Parte'}</span></div></div>)}</div>:<Empty/>}</div><div className="panel"><div className="sectionTitle"><span><AlertTriangle/> Pontos de atenção</span><small>Revisão recomendada</small></div>{alerts.length?<div className="alertList">{alerts.slice(0,5).map((a:any,i:number)=><div className="alertItem" key={i}><span className={`severity ${String(a.gravidade||a.severidade||'média').toLowerCase()}`}></span><div><b>{a.descricao||a.titulo||'Ponto de atenção'}</b><p>{a.recomendacao||a.elementosConflitantes||''}</p></div></div>)}</div>:<Empty/>}</div></div><div className="panel"><div className="sectionTitle"><span><FileText/> Relatório executivo</span></div><div className="reportText">{result.relatorioExecutivo?.visaoGeral||result.relatorioExecutivo?.conclusao||'O relatório executivo será exibido aqui quando disponível.'}</div></div></div>}
function Stat({icon,label,value}:{icon:any,label:string,value:any}){return <div><span>{icon}</span><b>{value}</b><small>{label}</small></div>}
function Timeline({items}:{items:any[]}){return <div className="panel full"><div className="sectionTitle"><span><CalendarDays/> Linha do tempo</span><small>{items.length} eventos</small></div>{items.length?<div className="timeline">{items.map((x:any,i:number)=><div className="timelineItem" key={i}><div className="timeDot"/><div><time>{x.data||x.dataEvento||'Data não identificada'}</time><b>{x.descricaoEvento||x.descricao||x.evento||'Evento'}</b><span>{x.fase||x.documento||''}</span></div></div>)}</div>:<Empty/>}</div>}
function Evidence({items}:{items:any[]}){return <div className="panel full"><div className="sectionTitle"><span><Search/> Evidências rastreadas</span><small>Alegação → documento → página</small></div>{items.length?<div className="evidenceGrid">{items.map((x:any,i:number)=><div className="evidence" key={i}><span className="tag">{x.categoria||x.tipo||'Evidência'}</span><b>{x.alegacao||x.descricao||'Grupo de evidência'}</b><p>{x.observacoes||x.relevanciaProbatoria||''}</p><div>{(x.documentos||x.documentosSuporte||[]).map((d:any,j:number)=><span className="citation" key={j}><FileText size={13}/>{typeof d==='string'?d:d.nome||'Documento'} {d.pagina?`· p. ${d.pagina}`:''}</span>)}</div></div>)}</div>:<Empty/>}</div>}
function Chat({chat,input,setInput,send,sending}:{chat:ChatMsg[],input:string,setInput:(s:string)=>void,send:()=>void,sending:boolean}){return <div className="chatLayout"><div className="panel chatPanel"><div className="chatHeader"><div><b><MessageSquare/> Chat com os autos</b><span>Respostas ancoradas no material analisado</span></div><span className="live"><i/> índice ativo</span></div><div className="messages">{!chat.length&&<div className="chatEmpty"><div><Bot/></div><h3>Converse com o processo</h3><p>Faça uma pergunta sobre fatos, documentos, prazos ou evidências.</p><div className="suggestions">{['Qual é a principal tese do autor?','Existe comprovante de pagamento?','Quais são os prazos críticos?'].map(x=><button key={x} onClick={()=>setInput(x)}>{x}</button>)}</div></div>}{chat.map((m,i)=><div className={`msg ${m.role}`} key={i}><div className="msgAvatar">{m.role==='assistant'?<Bot/>:<span>RV</span>}</div><div className="bubble"><p>{m.text}</p>{m.citations?.length?<div className="citations">{m.citations.map((c:any,j:number)=><span key={j}><FileText size={12}/>{c.documento||c.nomeDocumento||'Fonte'} {c.pagina?`· p. ${c.pagina}`:''}</span>)}</div>:null}</div></div>)}</div><div className="composer"><textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}} placeholder="Pergunte sobre o processo..." rows={2}/><button onClick={send} disabled={!input.trim()||sending}>{sending?<Loader2 className="spin"/>:<Send/>}</button></div></div></div>}
function SpecializedPanel({spec}:{spec:any}){return <div className="panel specialized"><div className="sectionTitle"><span><Sparkles/> Análise especializada</span><small>{spec.status}</small></div><pre>{JSON.stringify(spec.resultado||spec.mensagem||spec,null,2)}</pre></div>}
function Empty(){return <div className="empty"><Info size={18}/><span>Nenhuma informação disponível.</span></div>}
export default App