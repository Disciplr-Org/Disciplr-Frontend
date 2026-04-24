import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Vaults from "./pages/Vaults";
import CreateVault from "./pages/CreateVault";
import "./App.css";
import Notification from "./pages/Notification";
import NotificationSettings from "./pages/NotificationSettings";

export default function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/vaults" element={<Vaults />} />
            <Route path="/notification" element={<Notification />} />
            <Route
              path="/notification/settings"
              element={<NotificationSettings />}
            />
            <Route path="/vaults/create" element={<CreateVault />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </WalletProvider>
  );
}
