type PdfOptions = {
  title?: string
  fileName?: string
}

function escapePdfText(value: string): string {
  // The built-in Helvetica font uses WinAnsi encoding. Preserve the common
  // Portuguese/Western-European characters used by the legal report.
  const normalized = value
    .replace(/\u2013|\u2014/g, '-')
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2022/g, '-')
    .replace(/\u2192/g, '->')
    .replace(/\u2260/g, '!=')

  let out = ''
  for (const ch of normalized) {
    const code = ch.charCodeAt(0)
    if (code === 10 || code === 13) continue
    if (code <= 255) {
      out += String.fromCharCode(code)
    } else {
      out += '?'
    }
  }
  return out.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function wrapText(text: string, maxChars: number): string[] {
  const result: string[] = []
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+/g, ' ').trim()
    if (!line) {
      result.push('')
      continue
    }
    let remaining = line
    while (remaining.length > maxChars) {
      let cut = remaining.lastIndexOf(' ', maxChars)
      if (cut < Math.floor(maxChars * 0.55)) cut = maxChars
      result.push(remaining.slice(0, cut))
      remaining = remaining.slice(cut).trimStart()
    }
    result.push(remaining)
  }
  return result
}

function collectReportText(): string {
  const main = document.querySelector('main')
  if (!main) return document.body.innerText || ''

  const clone = main.cloneNode(true) as HTMLElement
  clone.querySelectorAll('button, input, textarea, select, .toast, nav').forEach(el => el.remove())

  const text = clone.innerText || clone.textContent || ''
  return text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
}

function buildPdf(text: string, title: string): Blob {
  const pageWidth = 595.28
  const pageHeight = 841.89
  const marginLeft = 48
  const marginRight = 48
  const top = 58
  const bottom = 52
  const fontSize = 9.5
  const lineHeight = 14
  const maxChars = 98
  const lines = wrapText(text, maxChars)
  const linesPerPage = Math.floor((pageHeight - top - bottom - 42) / lineHeight)

  const pages: string[][] = []
  for (let i = 0; i < lines.length; i += linesPerPage) pages.push(lines.slice(i, i + linesPerPage))
  if (!pages.length) pages.push([])

  const objects: string[] = []
  const pageIds: number[] = []

  const addObject = (body: string) => {
    objects.push(body)
    return objects.length
  }

  const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')

  pages.forEach((pageLines, pageIndex) => {
    const commands: string[] = []
    commands.push('q')
    commands.push('0.08 0.16 0.28 rg')
    commands.push('BT /F1 17 Tf 48 800 Td (' + escapePdfText(title) + ') Tj ET')
    commands.push('0 0 0 rg')
    commands.push(`BT /F1 ${fontSize} Tf ${marginLeft} ${pageHeight - top - 42} Td`)

    pageLines.forEach((line, index) => {
      if (index > 0) commands.push(`0 -${lineHeight} Td`)
      commands.push('(' + escapePdfText(line) + ') Tj')
    })
    commands.push('ET')
    commands.push('Q')

    const stream = commands.join('\n')
    const contentId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
    const pageId = addObject(`<< /Type /Page /Parent PAGES /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`)
    pageIds.push(pageId)
  })

  const pagesId = addObject('PAGES_PLACEHOLDER')
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`)

  // Patch the page parent now that the pages object number is known.
  const kids = pageIds.map(id => `${id} 0 R`).join(' ')
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${kids}] /Count ${pageIds.length} >>`
  pageIds.forEach(id => {
    objects[id - 1] = objects[id - 1].replace('PAGES', String(pagesId))
  })

  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'
  const offsets: number[] = [0]
  objects.forEach((obj, index) => {
    offsets[index + 1] = pdf.length
    pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`
  })

  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let i = 1; i <= objects.length; i++) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`

  // Convert the binary-safe string to bytes without UTF-8 re-encoding.
  const bytes = new Uint8Array(pdf.length)
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff
  return new Blob([bytes], { type: 'application/pdf' })
}

export function exportCurrentReportPdf(options: PdfOptions = {}) {
  const title = options.title || 'Relatório de análise jurídica'
  const text = collectReportText()
  const blob = buildPdf(text, title)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = options.fileName || 'relatorio-analise-juridica.pdf'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// The current App already exposes an "Exportar" action. Capture the click
// before React's old Markdown exporter runs, keeping this change isolated and
// backwards-compatible with the existing UI.
export function installPdfExportInterceptor() {
  document.addEventListener('click', event => {
    const target = event.target as HTMLElement | null
    const button = target?.closest('button') as HTMLButtonElement | null
    if (!button) return
    const label = (button.innerText || button.textContent || '').trim().toLowerCase()
    if (!label.includes('exportar')) return

    event.preventDefault()
    event.stopPropagation()
    if ('stopImmediatePropagation' in event) event.stopImmediatePropagation()

    const heading = document.querySelector('main h1, main h2')?.textContent?.trim() || 'Relatório de análise jurídica'
    const safe = heading.replace(/[^a-zA-Z0-9À-ÿ._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    exportCurrentReportPdf({ title: heading, fileName: `relatorio-${safe || 'analise-juridica'}.pdf` })
  }, true)
}
