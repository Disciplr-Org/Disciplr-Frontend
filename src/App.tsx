import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { WalletProvider } from './context/WalletContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Vaults from './pages/Vaults'
import CreateVault from './pages/CreateVault'
import VaultTransactions from './pages/VaultTransactions'

export default function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/vaults" element={<Vaults />} />
            <Route path="/vaults/create" element={<CreateVault />} />
            <Route path="/transactions" element={<VaultTransactions />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </WalletProvider>
  )
}
