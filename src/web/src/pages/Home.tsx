import { Link } from "react-router-dom";
import { CHAIN_NAME, TICKER, X_URL } from "../lib/config";
import { useNetworkStats } from "../lib/hooks";
import { formatBbc, formatNumber } from "../lib/format";

function LiveBand() {
  const { stats, error } = useNetworkStats(5000);
  const items: { label: string; value: string }[] = [
    { label: "Slot", value: stats ? formatNumber(stats.slot) : "—" },
    { label: "Epoch", value: stats ? formatNumber(stats.epoch) : "—" },
    { label: "Transactions", value: stats?.transactionCount != null ? formatNumber(stats.transactionCount) : "—" },
    { label: "Validators", value: stats?.validatorCount != null ? formatNumber(stats.validatorCount) : "—" },
    {
      label: `Supply`,
      value: stats?.totalSupplyLamports != null ? formatBbc(stats.totalSupplyLamports, 0) : "—",
    },
  ];
  return (
    <div className="card" style={{ padding: "6px 6px" }}>
      <div className="live-band">
        {items.map((it) => (
          <div key={it.label} style={{ padding: "12px 16px", textAlign: "center" }}>
            <div className="tiny dim" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>{it.label}</div>
            <div style={{ fontWeight: 700, marginTop: 4 }}>{it.value}</div>
          </div>
        ))}
      </div>
      {error && (
        <div className="tiny center dim" style={{ paddingBottom: 8 }}>
          Not connected to a node yet — set your RPC endpoint from the badge in the top right.
        </div>
      )}
    </div>
  );
}

function XLogo({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

function Feature({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card card-hover">
      <h3>{title}</h3>
      <p className="muted small" style={{ marginTop: 6 }}>{children}</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="glow">
      <div className="container">
        <section className="hero">
          <img src="/hero-banner.png" alt="Black Bull Chain" className="hero-banner" />
          <h1 className="visually-hidden">Black Bull Chain</h1>
          <p className="lead">
            The biggest, blackest blockchain in the WORLD. 🐂 Monster throughput, rock-hard
            finality, and enough girth to take any load you throw at it. {TICKER} for gas — no
            toolchain left unsatisfied.
          </p>
          <div className="row" style={{ justifyContent: "center", marginTop: 26 }}>
            <Link to="/explorer" className="btn btn-primary">Open Explorer</Link>
            <Link to="/wallet" className="btn">Create a Wallet</Link>
            <Link to="/docs" className="btn btn-ghost">Run a Validator →</Link>
          </div>
        </section>

        <section style={{ marginTop: 10 }}>
          <LiveBand />
        </section>

        <section className="section">
          <div className="grid grid-4">
            <Feature title="Fast & thick">
              Thousands of transactions per second and fees so tiny you'll barely feel them.
              {" "}{TICKER} finishes fast — but somehow always lasts.
            </Feature>
            <Feature title="Handles any load">
              Works with <code>@solana/web3.js</code>, SPL tokens, and the <code>blackbull</code> CLI.
              Point any Solana tool at {CHAIN_NAME} and it slides right in. No friction.
            </Feature>
            <Feature title="Grow your own">
              Anyone can stand one up. One script takes you from genesis to a fully engorged,
              block-producing node — no experience necessary.
            </Feature>
            <Feature title="Keep it in hand">
              A built-in wallet lets you hold your {TICKER} and send it wherever, whenever.
              Your keys, your girth — they never leave your device.
            </Feature>
          </div>
        </section>

        <section className="section grid grid-2" style={{ alignItems: "stretch" }}>
          <div className="card">
            <h2>The {TICKER} token</h2>
            <p className="muted" style={{ marginTop: 10 }}>
              {TICKER} is the native asset of the biggest, blackest chain in the world. It pays your
              fees, secures the network through staking, and moves value between accounts — always
              hard, never soft. 🐂
            </p>
            <div className="kv" style={{ marginTop: 14 }}>
              <div className="k">Ticker</div><div className="v">{TICKER}</div>
              <div className="k">Base unit</div><div className="v">1 {TICKER} = 1,000,000,000 lamports</div>
              <div className="k">Consensus</div><div className="v">Proof of Stake (Tower BFT)</div>
              <div className="k">Runtime</div><div className="v">Agave v4.1.1 (fork)</div>
            </div>
          </div>
          <div className="card">
            <h2>Get started in 3 steps</h2>
            <ol style={{ margin: "14px 0 0 0", listStyle: "none", display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                ["Whip out a wallet", <>Generate a {TICKER} address right in your browser — no extension, no shame. <Link className="link" to="/wallet">Open wallet →</Link></>],
                ["Get your hands on some BBC", <>Smash the faucet for a free airdrop, or sweet-talk someone into sliding you their {TICKER}.</>],
                ["Send it", <>Fire {TICKER} at any address and watch it land live in the <Link className="link" to="/explorer">explorer</Link>. Instant, satisfying, repeatable.</>],
              ].map(([t, d], i) => (
                <li key={i} className="row" style={{ alignItems: "flex-start", gap: 12 }}>
                  <span className="badge gold" style={{ minWidth: 26, justifyContent: "center" }}>{i + 1}</span>
                  <span><b>{t}</b><br /><span className="muted small">{d}</span></span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section">
          <div className="card center" style={{ padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ color: "var(--gold)" }}><XLogo size={40} /></div>
            <h2 style={{ marginTop: 8 }}>Follow {CHAIN_NAME} on X</h2>
            <p className="muted" style={{ maxWidth: 520, margin: "6px auto 0" }}>
              Join the herd for chain updates, $BBC news, and everything happening on the
              Biggest, Blackest Blockchain in the WORLD. 🐂
            </p>
            <a
              className="btn btn-primary"
              href={X_URL || "https://x.com/blackbullchain"}
              target="_blank"
              rel="noreferrer"
              style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <XLogo size={16} /> Follow @blackbullchain
            </a>
          </div>
        </section>

        <section className="section card center" style={{ padding: "40px 20px" }}>
          <h2>Build on {CHAIN_NAME}</h2>
          <p className="muted" style={{ maxWidth: 560, margin: "10px auto 0" }}>
            Full docs on hosting a validator, connecting apps, and sending {TICKER}.
          </p>
          <div className="row" style={{ justifyContent: "center", marginTop: 18 }}>
            <Link to="/docs" className="btn btn-primary">Read the docs</Link>
            <a className="btn" href="https://github.com/BlackBullChain/BlackBullChain" target="_blank" rel="noreferrer">View on GitHub</a>
            {X_URL && (
              <a className="btn" href={X_URL} target="_blank" rel="noreferrer">Follow on X</a>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
