import { API } from './src/api'

function currentJobId(): string | null {
  const active = localStorage.getItem('legal-analyzer:active-job-id')
  if (active) return active
  try {
    const recent = JSON.parse(localStorage.getItem('legal-analyzer:recent-jobs') || '[]')
    return recent?.[0]?.id || null
  } catch {
    return null
  }
}

async function downloadPersistedReport(jobId: string, fileName: string) {
  const response = await fetch(`${API}/api/v1/processos/analises/${encodeURIComponent(jobId)}/relatorio-pdf`)
  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new Error(message || `Não foi possível baixar o relatório (HTTP ${response.status}).`)
  }
  const blob = await response.blob()
  if (!blob.size) throw new Error('O servidor retornou um relatório PDF vazio.')
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function installPdfExportFix() {
  document.addEventListener('click', event => {
    const target = event.target as HTMLElement | null
    const clickable = target?.closest('button, a, [role="button"]') as HTMLElement | null
    const label = (clickable?.innerText || clickable?.textContent || '').trim().toLowerCase()
    if (!clickable || !label.includes('exportar')) return
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()

    const title = document.querySelector('main h1, main h2')?.textContent?.trim() || 'Relatório de análise jurídica'
    const safe = title.replace(/[^a-zA-Z0-9À-ÿ._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    const fileName = `relatorio-${safe || 'analise-juridica'}.pdf`
    const jobId = currentJobId()
    if (!jobId) {
      window.alert('Não foi possível identificar o processo atual para exportar o relatório.')
      return
    }

    downloadPersistedReport(jobId, fileName).catch(error => {
      console.error('[LEGAL ANALYZER] Falha ao exportar PDF persistido:', error)
      window.alert(error?.message || 'Não foi possível exportar o relatório PDF.')
    })
  }, true)
}
