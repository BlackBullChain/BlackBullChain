import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRecentTransfers, type Transfer } from "../lib/rpc";
import { formatBbc, timeAgo } from "../lib/format";
import { HashLink, Loading, Notice } from "../components/ui";

export default function Transfers() {
  const [transfers, setTransfers] = useState<Transfer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const t = await getRecentTransfers(80, 50);
        if (!alive) return;
        setTransfers(t);
        setLive(true);
        setError(null);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      }
    };
    load();
    const timer = setInterval(load, 6000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="container page">
      <div className="spread" style={{ alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "2rem" }}>Transfers</h1>
          <p className="muted" style={{ marginTop: 6 }}>Real wallet-to-wallet {`BBC`} moving across BlackBullChain, live.</p>
        </div>
        <span className="net-status" title="Live transfer feed">
          <span className={`dot ${live ? "pulse" : ""}`} style={{ color: live ? "var(--green)" : "var(--text-dim)" }} />
          {live ? "Live" : "Connecting…"}
        </span>
      </div>

      {error && (
        <div className="section">
          <Notice kind="err">Couldn’t load transfers: {error}</Notice>
        </div>
      )}

      <div className="section">
        {transfers === null ? (
          <Loading label="Scanning recent blocks…" />
        ) : transfers.length === 0 ? (
          <Notice>
            No transfers in the last blocks yet. Send some BBC from the{" "}
            <Link className="link" to="/wallet">Wallet</Link> and it'll show up here live.
          </Notice>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>From</th>
                    <th>To</th>
                    <th className="right">Amount</th>
                    <th>Transaction</th>
                    <th className="right">Age</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((t) => (
                    <tr key={t.signature + t.destination + t.lamports}>
                      <td><HashLink kind="address" value={t.source} edge={6} /></td>
                      <td><HashLink kind="address" value={t.destination} edge={6} /></td>
                      <td className="right" style={{ fontWeight: 700 }}>{formatBbc(t.lamports)}</td>
                      <td><HashLink kind="tx" value={t.signature} edge={8} /></td>
                      <td className="right muted">{timeAgo(t.blockTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
