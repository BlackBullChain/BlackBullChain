import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { CHAIN_NAME, PUMPFUN_URL, X_URL } from "../lib/config";
import { pingNode } from "../lib/rpc";

function BullMark() {
  // Shares the same asset as the browser-tab favicon (public/bull.svg), so the
  // logo stays in sync everywhere. The bull is baked in the brand teal.
  return (
    <img src="/bull.svg" width={24} height={24} alt="" aria-hidden="true" style={{ display: "block" }} />
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
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

// Read-only network indicator (no in-app endpoint editing).
function NetworkStatus() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    async function check() {
      const s = await pingNode();
      if (alive) setOk(s.ok);
    }
    check();
    const t = setInterval(check, 15000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);
  const color = ok === null ? "var(--text-dim)" : ok ? "var(--green)" : "var(--red)";
  const label = ok === null ? "…" : ok ? "Live" : "Offline";
  return (
    <span className="net-status" title="BlackBullChain network status">
      <span className={`dot ${ok === null ? "pulse" : ""}`} style={{ color }} /> {label}
    </span>
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
              <NavLink to="/blocks">Blocks</NavLink>
              <NavLink to="/wallet">Wallet</NavLink>
              <NavLink to="/peg">Peg</NavLink>
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
            <NetworkStatus />
          </div>
        </div>
        {menuOpen && (
          <div className="mobile-menu">
            <NavLink to="/explorer" onClick={closeMenu}>Explorer</NavLink>
            <NavLink to="/blocks" onClick={closeMenu}>Blocks</NavLink>
            <NavLink to="/wallet" onClick={closeMenu}>Wallet</NavLink>
            <NavLink to="/peg" onClick={closeMenu}>Peg</NavLink>
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
          <div className="row" style={{ gap: 16, alignItems: "center" }}>
            {X_URL && (
              <a href={X_URL} target="_blank" rel="noreferrer" aria-label="Follow on X"
                className="row" style={{ gap: 6, alignItems: "center" }}>
                <XIcon /> X
              </a>
            )}
            <a href="https://github.com/BlackBullChain/BlackBullChain" target="_blank" rel="noreferrer">GitHub</a>
            <NavLink to="/docs">Docs</NavLink>
          </div>
        </div>
      </footer>
    </>
  );
}
