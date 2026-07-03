import { Link } from "react-router-dom";
import { CHAIN_NAME, TICKER } from "../lib/config";
import { useNetworkStats } from "../lib/hooks";
import { formatBbc, formatNumber } from "../lib/format";

function LiveBand() {
  const { stats, error } = useNetworkStats(5000);
  const items: { label: string; value: string }[] = [
    { label: "Slot", value: stats ? formatNumber(stats.slot) : "—" },
    { label: "Epoch", value: stats ? formatNumber(stats.epoch) : "—" },
    { label: "TPS", value: stats?.tps != null ? formatNumber(stats.tps) : "—" },
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

function Feature({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="card card-hover">
      <div style={{ fontSize: 24 }}>{icon}</div>
      <h3 style={{ marginTop: 10 }}>{title}</h3>
      <p className="muted small" style={{ marginTop: 6 }}>{children}</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="glow">
      <div className="container">
        <section className="hero">
          <div className="eyebrow">Solana-compatible Layer 1</div>
          <h1 style={{ marginTop: 14 }}>
            The chain that <span className="gradient-text">charges forward</span>
          </h1>
          <p className="lead">
            {CHAIN_NAME} is a high-throughput, low-fee blockchain running the battle-tested Agave
            runtime. Sub-second finality, {TICKER} for gas, and full compatibility with the Solana
            toolchain you already know.
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
            <Feature icon="⚡" title="Fast & cheap">
              Thousands of transactions per second with fees measured in fractions of a cent —
              inherited from the Agave/Solana runtime.
            </Feature>
            <Feature icon="🧰" title="Solana-compatible">
              Works with <code>@solana/web3.js</code>, SPL tokens, and the <code>blackbull</code> CLI.
              Point any Solana tool at a {CHAIN_NAME} RPC and it just works.
            </Feature>
            <Feature icon="🖥️" title="Run your own node">
              Anyone can host a validator and help secure the network. One script takes you from
              genesis to a block-producing node.
            </Feature>
            <Feature icon="🔑" title="Own your keys">
              A built-in browser wallet lets you create an address, hold {TICKER}, and send &amp;
              receive in seconds — keys never leave your device.
            </Feature>
          </div>
        </section>

        <section className="section grid grid-2" style={{ alignItems: "stretch" }}>
          <div className="card">
            <h2>The {TICKER} token</h2>
            <p className="muted" style={{ marginTop: 10 }}>
              {TICKER} is the native asset of {CHAIN_NAME}. It pays for transaction fees, secures the
              network through staking, and moves value between accounts.
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
                ["Create a wallet", <>Generate a {TICKER} address in your browser — no extension needed. <Link className="link" to="/wallet">Open wallet →</Link></>],
                ["Get some BBC", <>On a dev network, request an airdrop from the faucet, or ask someone to send you {TICKER}.</>],
                ["Send & explore", <>Send {TICKER} to any address and watch it confirm live in the <Link className="link" to="/explorer">explorer</Link>.</>],
              ].map(([t, d], i) => (
                <li key={i} className="row" style={{ alignItems: "flex-start", gap: 12 }}>
                  <span className="badge gold" style={{ minWidth: 26, justifyContent: "center" }}>{i + 1}</span>
                  <span><b>{t}</b><br /><span className="muted small">{d}</span></span>
                </li>
              ))}
            </ol>
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
          </div>
        </section>
      </div>
    </div>
  );
}
