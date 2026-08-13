import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import './layout-redesign.css'
import { installPdfExportInterceptor } from './pdfExport'

installPdfExportInterceptor()

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
)