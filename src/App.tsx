import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { WalletProvider } from './context/WalletContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Vaults from './pages/Vaults'
import CreateVault from './pages/CreateVault'
import VaultTransactions from './pages/VaultTransactions'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <ThemeProvider>
      <WalletProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/vaults" element={<Vaults />} />
              <Route path="/vaults/create" element={<CreateVault />} />
              <Route path="/vaults/:id/transactions" element={<VaultTransactions />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </WalletProvider>
    </ThemeProvider>
  )
}
