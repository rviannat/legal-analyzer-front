import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import DataJudOverlay from './DataJudOverlay'
import './styles.css'
import './layout-redesign.css'
import './datajud.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><><App/><DataJudOverlay/></></React.StrictMode>
)
