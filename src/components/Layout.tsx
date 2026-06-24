import React, { useState, type HTMLAttributes } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { WalletConnectButton } from "./Wallet/WalletConnectButton";
import MobileDrawer from "./MobileDrawer";
import { NetworkGuardBanner } from "./NetworkGuardBanner";
import { Text } from "./Text";
import "./Layout.css";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = () => setDrawerOpen(prev => !prev);
  const location = useLocation();
  const isTransactionsActive = location.pathname === "/transactions";
  const backgroundA11yProps = isDrawerOpen
    ? ({ "aria-hidden": true, inert: "" } as HTMLAttributes<HTMLElement> & { inert: "" })
    : {};

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <header className="site-header">
        <div className="header-brand" {...backgroundA11yProps}>
          <Link to="/" className="header-link" aria-label="Disciplr home">
            <Text role="title" as="span">
              Disciplr
            </Text>
          </Link>
          <Link
            to="/transactions"
            className={`header-link${isTransactionsActive ? " active" : ""}`}
            style={{
              color: isTransactionsActive ? "var(--accent)" : "var(--muted)",
            }}
            aria-label="Transactions"
            aria-current={isTransactionsActive ? "page" : undefined}
          >
            <span className="header-transactions-label">Transactions</span>
            <span
              aria-hidden="true"
              className="header-transactions-icon"
              style={{ display: "none" }}
            >
              ↗
            </span>
          </Link>
        </div>

        <nav className="desktop-nav" {...backgroundA11yProps}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link
              to="/"
              className="header-link"
              style={{
                color:
                  location.pathname === "/" ? "var(--accent)" : "var(--muted)",
              }}
            >
              <Text role="caption" as="span">
                Home
              </Text>
            </Link>

            <Link
              to="/analytics"
              style={{
                color:
                  location.pathname === "/analytics"
                    ? "var(--accent)"
                    : "var(--muted)",
                textDecoration: "none",
              }}
            >
              Analytics
            </Link>

            <Link
              to="/vaults/create"
              style={{
                color: "var(--surface)",
                background: "var(--accent)",
                padding: "0.5rem 1rem",
                borderRadius: "9999px",
                textDecoration: "none",
                fontWeight: 500,
                fontSize: "0.875rem",
              }}
            >
              Create Vault
            </Link>
            <WalletConnectButton />
          </div>
        </nav>
        <button
          type="button"
          className="mobile-hamburger"
          aria-label="Open navigation menu"
          aria-controls="mobile-drawer"
          aria-expanded={isDrawerOpen}
          onClick={toggleDrawer}
        >
          <Menu size={24} aria-hidden="true" />
        </button>
        <MobileDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} />
      </header>

      <div {...backgroundA11yProps}>
        <NetworkGuardBanner />
      </div>

      <main
        {...backgroundA11yProps}
        style={{
          flex: 1,
          padding: "var(--spacing-8)",
          maxWidth: "var(--container-standard)",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {children}
      </main>
    </div>
  );
}
