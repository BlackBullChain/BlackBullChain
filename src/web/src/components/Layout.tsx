import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { CHAIN_NAME, DEFAULT_RPC_URL, PUMPFUN_URL, getRpcUrl, resetRpcUrl, setRpcUrl } from "../lib/config";
import { pingNode } from "../lib/rpc";

function BullMark() {
  return (
    <svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true" style={{ color: "var(--gold)" }}>
      <path d="M21.6 22.4c1.95 4.38 5.16 9.15 8.46 12.4-1.42.2-3.05.29-4.93.29C6.9 35.09 1.3 15.6 1.3 8.2c0-2.02.48-4.4.48-4.4C6.76 14.8 12.7 22 21.06 24.3c.35.09.7.16 1.06.2-.18-.7-.35-1.4-.52-2.1z" />
      <path d="M48 34c0 4.2-4.1 7.5-8.7 7.5-6.3 0-10.9-4.1-15.5-13.3-2.1-4.2-4.1-12-4.1-16.8 0-3.2.6-4.8.6-4.8 2.95 7.1 4.35 9.4 9.1 15.7 3.7 4.9 7.5 8 12.6 10 .5.2 1.1-.05 1.28-.55.18-.55-.12-1.15-.68-1.34-2.42-.8-4.65-2.3-6.5-3.9 1.1-.1 2.35-.16 3.5-.16 4.95 0 8.5 3.28 8.5 7.8z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.34-4.34" />
    </svg>
  );
}

function Chevron() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function MoreMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);
  return (
    <div className="more-wrap" ref={ref}>
      <button className="more-trigger" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        More <Chevron />
      </button>
      {open && (
        <div className="more-menu" role="menu">
          <Link to="/docs" onClick={() => setOpen(false)}>Run a validator</Link>
          <a href="https://github.com/BlackBullChain/BlackBullChain" target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>GitHub</a>
          <a href="https://github.com/BlackBullChain/BlackBullChain/blob/main/docs/SPEC.md" target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>Whitepaper</a>
        </div>
      )}
    </div>
  );
}

function RpcSwitcher() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(getRpcUrl());
  const [status, setStatus] = useState<{ ok: boolean; version?: string; error?: string } | null>(null);
  const [checking, setChecking] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  async function check() {
    setChecking(true);
    setStatus(await pingNode());
    setChecking(false);
  }
  useEffect(() => {
    check();
    const t = setInterval(check, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function apply() {
    setRpcUrl(url);
    check();
    setOpen(false);
  }
  function reset() {
    resetRpcUrl();
    setUrl(DEFAULT_RPC_URL);
    check();
  }

  const dotColor = checking ? "var(--text-dim)" : status?.ok ? "var(--green)" : "var(--red)";
  const label = checking ? "Connecting…" : status?.ok ? "Connected" : "Connect";

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button className="btn-elev" onClick={() => setOpen((o) => !o)}>
        <span className={`dot ${checking ? "pulse" : ""}`} style={{ color: dotColor }} /> {label}
      </button>
      {open && (
        <div className="card" style={{ position: "absolute", right: 0, top: 44, width: 320, zIndex: 60, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
          <div className="field-label">RPC endpoint</div>
          <input className="input mono" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://localhost:8899" />
          {status && !status.ok && <div className="tiny" style={{ color: "var(--red)", marginTop: 8 }}>{status.error}</div>}
          {status?.ok && status.version && <div className="tiny" style={{ color: "var(--green)", marginTop: 8 }}>Node v{status.version}</div>}
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn btn-primary btn-sm" onClick={apply}>Connect</button>
            <button className="btn btn-ghost btn-sm" onClick={reset}>Reset</button>
          </div>
          <div className="tiny dim" style={{ marginTop: 10 }}>Point at any BlackBullChain node (e.g. your Mac Mini over Tailscale).</div>
        </div>
      )}
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <nav className="nav-primary">
            <button className="hamburger" aria-label="Menu" onClick={() => setMenuOpen((o) => !o)}>
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
            <NavLink to="/" className="brand" onClick={closeMenu}>
              <BullMark />
              <span>Black<b>Bull</b>Chain</span>
            </NavLink>
            <div className="nav-links">
              <NavLink to="/explorer">Explorer</NavLink>
              <NavLink to="/wallet">Wallet</NavLink>
              <NavLink to="/docs">Docs</NavLink>
              <MoreMenu />
              <a className="ring-btn" href={PUMPFUN_URL} target="_blank" rel="noreferrer">$BBC</a>
            </div>
          </nav>
          <div className="nav-actions">
            <button className="icon-btn desktop-only" onClick={() => nav("/explorer")} aria-label="Search">
              <SearchIcon />
              <span className="show-xl">Search</span>
            </button>
            <RpcSwitcher />
          </div>
        </div>
        {menuOpen && (
          <div className="mobile-menu">
            <NavLink to="/explorer" onClick={closeMenu}>Explorer</NavLink>
            <NavLink to="/wallet" onClick={closeMenu}>Wallet</NavLink>
            <NavLink to="/docs" onClick={closeMenu}>Docs</NavLink>
            <a href="https://github.com/BlackBullChain/BlackBullChain" target="_blank" rel="noreferrer" onClick={closeMenu}>GitHub</a>
            <a className="ring-btn" href={PUMPFUN_URL} target="_blank" rel="noreferrer" onClick={closeMenu}>$BBC</a>
          </div>
        )}
      </header>
      <main>{children}</main>
      <footer className="footer">
        <div className="container spread">
          <div>{CHAIN_NAME} — The Biggest, Blackest Blockchain in the WORLD. 🐂</div>
          <div className="row" style={{ gap: 16 }}>
            <a href="https://github.com/BlackBullChain/BlackBullChain" target="_blank" rel="noreferrer">GitHub</a>
            <NavLink to="/docs">Docs</NavLink>
          </div>
        </div>
      </footer>
    </>
  );
}
