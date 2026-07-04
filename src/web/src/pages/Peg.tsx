import { TICKER, PUMPFUN_URL } from "../lib/config";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="row" style={{ alignItems: "flex-start", gap: 14 }}>
      <span className="badge gold" style={{ minWidth: 26, justifyContent: "center" }}>{n}</span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <b>{title}</b>
        <div className="muted small" style={{ marginTop: 4 }}>{children}</div>
      </div>
    </div>
  );
}

export default function Peg() {
  return (
    <div className="container page glow" style={{ maxWidth: 720 }}>
      <div className="center" style={{ padding: "40px 0 10px" }}>
        <span className="badge gold" style={{ fontSize: "0.8rem" }}>Coming soon</span>
        <h1 style={{ marginTop: 16 }}>
          Peg <span className="gradient-text">$BBC → {TICKER}</span>
        </h1>
        <p className="lead muted" style={{ maxWidth: 560, margin: "16px auto 0" }}>
          A 1:1 bridge from <b>pump.fun $BBC</b> on Solana to native <b>{TICKER}</b> on BlackBullChain.
          Both have a fixed supply of 1,000,000,000 — every native {TICKER} will be backed one-to-one
          by a pump $BBC locked in the bridge.
        </p>
      </div>

      <div className="card section">
        <h3 style={{ marginBottom: 14 }}>How the 1:1 peg will work</h3>
        <div className="stack" style={{ gap: 16 }}>
          <Step n={1} title="Deposit $BBC on Solana">
            Send your pump.fun $BBC to the bridge treasury, tagged with your BlackBullChain address.
          </Step>
          <Step n={2} title="The bridge locks it">
            Your $BBC is held 1:1 in the treasury — it never leaves. That’s what backs your native {TICKER}.
          </Step>
          <Step n={3} title="Receive native {TICKER}">
            The relayer releases the exact same amount of native {TICKER} to your address. 1 $BBC → 1 {TICKER}, no fee.
          </Step>
        </div>
      </div>

      <div className="card section center" style={{ padding: "32px 20px" }}>
        <h3>The peg isn’t live yet</h3>
        <p className="muted" style={{ maxWidth: 480, margin: "8px auto 0" }}>
          It’s built and ready — it goes live once the $BBC token and the BlackBullChain mainnet are up.
          Grab $BBC now so you’re ready to peg on day one.
        </p>
        <div className="row" style={{ justifyContent: "center", marginTop: 18 }}>
          <a className="btn btn-primary" href={PUMPFUN_URL} target="_blank" rel="noreferrer">Get $BBC on pump.fun</a>
        </div>
      </div>
    </div>
  );
}
