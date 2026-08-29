import React, { useCallback, useEffect, useReducer, useRef, type HTMLAttributes } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { WalletConnectButton } from "./Wallet/WalletConnectButton";
import MobileDrawer from "./MobileDrawer";
import NavLink from "./NavLink";
import { Text } from "./Text";
import { TrustlineBanner } from "./TrustlineBanner";
import NotificationBell from "./Notification/NotificationBell";
import { ShortcutsHelp } from "./ShortcutsHelp";
import ErrorBoundary from "./ErrorBoundary";
import { ToastViewport } from "./ToastViewport";
import ThemeToggle from "./ThemeToggle";
import CommandPalette from "./CommandPalette";
import {
  DRAWER_INITIAL_STATE,
  isDrawerOpen,
  reduceDrawerState,
  shouldCloseDrawerOnRouteChange,
} from "../utils/drawerState";
import { useBreakpoint } from "../utils/useBreakpoint";
import "./Layout.css";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  // All drawer transitions flow through the reducer so open/close/toggle and
  // the route-change/resize recovery events are deterministic and idempotent
  // (see src/utils/drawerState.ts for the state machine and its invariants).
  const [drawerState, dispatchDrawer] = useReducer(
    reduceDrawerState,
    DRAWER_INITIAL_STATE,
  );
  const drawerIsOpen = isDrawerOpen(drawerState);
  const closeDrawer = useCallback(() => dispatchDrawer({ type: "CLOSE" }), []);
  const toggleDrawer = () => dispatchDrawer({ type: "TOGGLE" });
  const location = useLocation();

  // Deep-link / navigation recovery: close the drawer whenever the route
  // actually changes (in-app navigation, browser back/forward, deep links).
  // Guarded by shouldCloseDrawerOnRouteChange so a stale location object with
  // an unchanged pathname can never close a freshly opened drawer.
  const prevPathnameRef = useRef(location.pathname);
  useEffect(() => {
    const prevPathname = prevPathnameRef.current;
    prevPathnameRef.current = location.pathname;
    if (shouldCloseDrawerOnRouteChange(prevPathname, location.pathname)) {
      dispatchDrawer({ type: "ROUTE_CHANGE" });
    }
  }, [location.pathname]);

  // Resize recovery: the drawer is a mobile-only surface. When the viewport
  // crosses into the desktop breakpoint (768px+), close the drawer and release
  // the scroll lock so the desktop nav is never trapped behind a hidden drawer.
  const isDesktop = useBreakpoint("md");
  useEffect(() => {
    if (isDesktop) {
      dispatchDrawer({ type: "RESIZE_DESKTOP" });
    }
  }, [isDesktop]);

  const backgroundA11yProps = drawerIsOpen
    ? ({ "aria-hidden": true, inert: "" } as HTMLAttributes<HTMLElement> & {
        inert: "";
      })
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
            >
              ↗
            </span>
          </NavLink>
        </div>

        <nav
          className="desktop-nav"
          aria-label="Main navigation"
          {...backgroundA11yProps}
        >
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

            <NavLink to="/dashboard" className="header-link">
              <Text role="caption" as="span">
                Dashboard
              </Text>
            </NavLink>

            <NavLink
              to="/vaults"
              className="header-link"
              aria-current={
                // "Create Vault" is its own top-level nav item with an exact
                // match below, so it must not also count as "Vaults" being
                // active (otherwise two nav links would both be "current").
                location.pathname.startsWith("/vaults") &&
                location.pathname !== "/vaults/create"
                  ? "page"
                  : undefined
              }
            >
              <Text role="caption" as="span">
                Vaults
              </Text>
            </NavLink>

            <NavLink to="/verifier" className="header-link">
              <Text role="caption" as="span">
                Verifier
              </Text>
            </NavLink>

            <NavLink
              to="/analytics"
              className="header-link"
              aria-current={
                location.pathname === "/analytics" ? "page" : undefined
              }
            >
              <Text role="caption" as="span">
                Analytics
              </Text>
            </NavLink>

            <NavLink
              to="/help"
              className="header-link"
              aria-current={location.pathname.startsWith('/help') ? 'page' : undefined}
            >
              <Text role="caption" as="span">
                Help
              </Text>
            </NavLink>

            <Link
              to="/vaults/create"
              className="header-link header-cta"
              aria-current={
                location.pathname === "/vaults/create" ? "page" : undefined
              }
            >
              Create Vault
            </Link>
            <CommandPalette />
            <NotificationBell />
            <ThemeToggle />
            <WalletConnectButton />
          </div>
        </nav>
        <div className="mobile-bell-wrapper" {...backgroundA11yProps}>
          <NotificationBell />
          <ThemeToggle />
        </div>
        <button
          type="button"
          className="mobile-hamburger"
          aria-label="Open navigation menu"
          aria-controls="mobile-drawer"
          aria-expanded={drawerIsOpen}
          onClick={toggleDrawer}
        >
          <Menu size={24} aria-hidden="true" />
        </button>
        <MobileDrawer isOpen={drawerIsOpen} onClose={closeDrawer} />
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
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <ShortcutsHelp />
      <ToastViewport />
    </div>
  );
}
