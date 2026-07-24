import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { reportWebVitals } from './utils/reportWebVitals'

// Report web vitals in production or when a reporter is provided
// In development, this defaults to a no-op unless explicitly configured
if (import.meta.env.PROD) {
  reportWebVitals((metric) => {
    // In production, you can send metrics to your analytics service
    // Example: sendToAnalytics(metric)
    console.log('[Web Vitals]', metric)
  })
} else {
  // In development, report to console for debugging
  reportWebVitals((metric) => {
    console.log('[Web Vitals]', metric)
  })
}

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found')

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
