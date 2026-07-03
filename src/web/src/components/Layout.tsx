import { useEffect, useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { CHAIN_NAME, DEFAULT_RPC_URL, getRpcUrl, resetRpcUrl, setRpcUrl } from "../lib/config";
import { pingNode } from "../lib/rpc";

function RpcSwitcher() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(getRpcUrl());
  const [status, setStatus] = useState<{ ok: boolean; version?: string; error?: string } | null>(null);
  const [checking, setChecking] = useState(true);

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

  const badge = checking
    ? { cls: "badge", text: "checking…", dotCls: "dot pulse" }
    : status?.ok
      ? { cls: "badge ok", text: `connected${status.version ? ` · v${status.version}` : ""}`, dotCls: "dot" }
      : { cls: "badge err", text: "no node", dotCls: "dot" };

  return (
    <div style={{ position: "relative" }}>
      <button className={badge.cls} onClick={() => setOpen((o) => !o)} style={{ cursor: "pointer" }}>
        <span className={badge.dotCls} /> {badge.text}
      </button>
      {open && (
        <div
          className="card"
          style={{ position: "absolute", right: 0, top: 38, width: 320, zIndex: 60, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}
        >
          <div className="field-label">RPC endpoint</div>
          <input className="input mono" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://localhost:8899" />
          {status && !status.ok && (
            <div className="tiny err-text" style={{ color: "var(--red)", marginTop: 8 }}>
              {status.error}
            </div>
          )}
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn btn-primary btn-sm" onClick={apply}>Connect</button>
            <button className="btn btn-ghost btn-sm" onClick={reset}>Reset</button>
          </div>
          <div className="tiny dim" style={{ marginTop: 10 }}>
            Point this at any BlackBullChain node (e.g. your Mac Mini over Tailscale).
          </div>
        </div>
      )}
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="nav">
        <div className="container nav-inner">
          <NavLink to="/" className="brand">
            <img src="/bull.svg" alt="" />
            <span>Black<b>Bull</b>Chain</span>
          </NavLink>
          <nav className="nav-links">
            <NavLink to="/explorer">Explorer</NavLink>
            <NavLink to="/wallet">Wallet</NavLink>
            <NavLink to="/docs" className="hide-sm">Docs</NavLink>
            <RpcSwitcher />
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="footer">
        <div className="container spread">
          <div>{CHAIN_NAME} — a fast, Solana-compatible Layer 1. Native token BBC.</div>
          <div className="row" style={{ gap: 16 }}>
            <a href="https://github.com/BlackBullChain/BlackBullChain" target="_blank" rel="noreferrer">GitHub</a>
            <NavLink to="/docs">Docs</NavLink>
          </div>
        </div>
      </footer>
    </>
  );
}
