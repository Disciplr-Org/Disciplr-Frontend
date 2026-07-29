import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { WalletProvider } from './context/WalletContext'
import { AppConfigProvider } from './context/AppConfigContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import RequireWallet from './components/RequireWallet'
import Skeleton from './components/Skeleton'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Vaults from './pages/Vaults'
import CreateVault from './pages/CreateVault'
import VaultDetail from './pages/VaultDetail'
import VaultTransactions from './pages/VaultTransactions'
import VerifierDashboard from './pages/VerifierDashboard'
import PendingValidations from './pages/PendingValidations'
import ValidationDetail from './pages/ValidationDetail'
import ValidationHistory from './pages/ValidationHistory'
import HelpCenter from './pages/HelpCenter'
import NotFound from './pages/NotFound'

const Analytics = lazy(() => import('./pages/Analytics'))
const Notification = lazy(() => import('./pages/Notification'))
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'))

const PageFallback = <Skeleton className="w-full h-screen" />

export default function App() {
  return (
    <ThemeProvider>
      <WalletProvider>
        <AppConfigProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/vaults" element={<Vaults />} />
                  <Route path="/vaults/create" element={<RequireWallet><CreateVault /></RequireWallet>} />
                  <Route path="/vaults/:id" element={<RequireWallet><VaultDetail /></RequireWallet>} />
                  <Route path="/vaults/:id/transactions" element={<VaultTransactions />} />
                  <Route path="/transactions" element={<VaultTransactions />} />
                  <Route path="/verifier" element={<VerifierDashboard />} />
                  <Route path="/verifier/queue" element={<RequireWallet><PendingValidations /></RequireWallet>} />
                  <Route path="/verifier/queue/:vaultId" element={<RequireWallet><ValidationDetail /></RequireWallet>} />
                  <Route path="/verifier/history" element={<ValidationHistory />} />
                  <Route path="/help" element={<HelpCenter />} />
                  <Route path="/help/search" element={<HelpCenter />} />
                  <Route
                    path="/analytics"
                    element={
                      <Suspense fallback={PageFallback}>
                        <Analytics />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <Suspense fallback={PageFallback}>
                        <Notification />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/notifications/settings"
                    element={
                      <Suspense fallback={PageFallback}>
                        <NotificationSettings />
                      </Suspense>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </ErrorBoundary>
          </BrowserRouter>
        </AppConfigProvider>
      </WalletProvider>
    </ThemeProvider>
  )
}
