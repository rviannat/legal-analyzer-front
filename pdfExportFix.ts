import { exportCurrentReportPdf } from './pdfExport'

export function installPdfExportFix() {
  document.addEventListener('click', event => {
    const target = event.target as HTMLElement | null
    const clickable = target?.closest('button, a, [role="button"]') as HTMLElement | null
    const label = (clickable?.innerText || clickable?.textContent || '').trim().toLowerCase()
    if (!clickable || !label.includes('exportar')) return
    event.preventDefault()
    event.stopPropagation()
    const title = document.querySelector('main h1, main h2')?.textContent?.trim() || 'Relatório de análise jurídica'
    const safe = title.replace(/[^a-zA-Z0-9À-ÿ._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    exportCurrentReportPdf({ title, fileName: `relatorio-${safe || 'analise-juridica'}.pdf` })
  }, true)
}
