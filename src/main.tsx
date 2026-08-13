import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import DataJudOverlay from './DataJudOverlay'
import ProcessSearchBar from './ProcessSearchBar'
import './styles.css'
import './layout-redesign.css'
import './datajud.css'
import './process-search.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><><App/><ProcessSearchBar/><DataJudOverlay/></></React.StrictMode>
)
