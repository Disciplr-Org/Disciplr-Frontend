import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { reportWebVitals } from './utils/reportWebVitals'

reportWebVitals((metric) => {
  console.log('[Web Vitals]', metric)
})

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found')

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
