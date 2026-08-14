import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import ProcessosCentral from './ProcessosCentral'
import './styles.css'
import './layout-redesign.css'
import './processos-central.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><><App /><ProcessosCentral /></></React.StrictMode>
)
