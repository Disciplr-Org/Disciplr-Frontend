import React, { useState, type HTMLAttributes } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { WalletConnectButton } from "./Wallet/WalletConnectButton";
import MobileDrawer from "./MobileDrawer";
import NavLink from "./NavLink";
import { Text } from "./Text";
import { TrustlineBanner } from "./TrustlineBanner";
import NotificationBell from "./Notification/NotificationBell";
import "./Layout.css";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = () => setDrawerOpen(prev => !prev);
  const location = useLocation();
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
          <NavLink
            to="/transactions"
            className="header-link"
            ariaLabel="Transactions"
          >
            <span className="header-transactions-label">Transactions</span>
            <span
              aria-hidden="true"
              className="header-transactions-icon"
              style={{ display: "none" }}
            >
              ↗
            </span>
          </NavLink>
        </div>

        <nav className="desktop-nav" aria-label="Main navigation" {...backgroundA11yProps}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <NavLink
              to="/"
              className="header-link"
              aria-current={location.pathname === "/" ? "page" : undefined}
            >
              <Text role="caption" as="span">
                Home
              </Text>
            </NavLink>

            <NavLink
              to="/verifier"
              className="header-link"
            >
              <Text role="caption" as="span">
                Verifier
              </Text>
            </NavLink>

            <NavLink
              to="/analytics"
              className="header-link"
              aria-current={location.pathname === "/analytics" ? "page" : undefined}
            >
              <Text role="caption" as="span">
                Analytics
              </Text>
            </NavLink>

            <Link
              to="/vaults/create"
              className="header-link header-cta"
              aria-current={location.pathname === "/vaults/create" ? "page" : undefined}
            >
              Create Vault
            </Link>
            <NotificationBell />
            <WalletConnectButton />
          </div>
        </nav>
        <div className="mobile-bell-wrapper" {...backgroundA11yProps}>
          <NotificationBell />
        </div>
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
      <TrustlineBanner />

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
