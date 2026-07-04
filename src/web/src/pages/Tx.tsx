import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getConnection } from "../lib/rpc";
import { formatBbc, formatNumber, formatTimestamp } from "../lib/format";
import { HashLink, CopyButton, Loading, Notice } from "../components/ui";

interface AccountRow {
  pubkey: string;
  signer: boolean;
  delta: number;
  post: number;
}

interface TxView {
  slot: number;
  blockTime: number | null;
  success: boolean;
  errText: string | null;
  feeLamports: number;
  computeUnits: number | null;
  accounts: AccountRow[];
  logs: string[];
  signatures: string[];
}

export default function Tx() {
  const { sig } = useParams();
  const [tx, setTx] = useState<TxView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    setTx(null);
    (async () => {
      try {
        const r = await getConnection().getTransaction(sig!, {
          maxSupportedTransactionVersion: 0,
          commitment: "confirmed",
        });
        if (!alive) return;
        if (!r) {
          setError("Transaction not found. It may still be processing, or the signature is invalid.");
          return;
        }
        const msg = r.transaction.message;
        const keys = msg.staticAccountKeys;
        const numSigners = msg.header.numRequiredSignatures;
        const pre = r.meta?.preBalances ?? [];
        const post = r.meta?.postBalances ?? [];
        const accounts: AccountRow[] = keys.map((k, i) => ({
          pubkey: k.toBase58(),
          signer: i < numSigners,
          delta: (post[i] ?? 0) - (pre[i] ?? 0),
          post: post[i] ?? 0,
        }));
        setTx({
          slot: r.slot,
          blockTime: r.blockTime ?? null,
          success: !r.meta?.err,
          errText: r.meta?.err ? JSON.stringify(r.meta.err) : null,
          feeLamports: r.meta?.fee ?? 0,
          computeUnits: r.meta?.computeUnitsConsumed ?? null,
          accounts,
          logs: r.meta?.logMessages ?? [],
          signatures: r.transaction.signatures,
        });
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [sig]);

  return (
    <div className="container page">
      <h1 style={{ fontSize: "1.6rem" }}>Transaction</h1>
      <div className="row" style={{ marginTop: 6 }}>
        <span className="mono small break muted">{sig}</span>
        <CopyButton text={sig ?? ""} />
      </div>

      {loading && <div className="section"><Loading /></div>}
      {error && <div className="section"><Notice kind="err">{error}</Notice></div>}

      {tx && (
        <>
          <div className="card section">
            <div className="kv">
              <div className="k">Status</div>
              <div className="v">
                {tx.success ? <span className="badge ok"><span className="dot" /> Success</span> : <span className="badge err"><span className="dot" /> Failed</span>}
                {tx.errText && <span className="muted small" style={{ marginLeft: 10 }}>{tx.errText}</span>}
              </div>
              <div className="k">Slot</div><div className="v"><HashLink kind="block" value={tx.slot} full /></div>
              <div className="k">Timestamp</div><div className="v">{formatTimestamp(tx.blockTime)}</div>
              <div className="k">Fee</div><div className="v">{formatBbc(tx.feeLamports)}</div>
              <div className="k">Compute units</div><div className="v">{tx.computeUnits != null ? formatNumber(tx.computeUnits) : "—"}</div>
            </div>
          </div>

          <div className="section">
            <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>Account balance changes</h2>
            <div className="card" style={{ padding: 0 }}>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Account</th><th>Role</th><th className="right">Change</th><th className="right">Post balance</th></tr>
                  </thead>
                  <tbody>
                    {tx.accounts.map((a) => (
                      <tr key={a.pubkey}>
                        <td><HashLink kind="address" value={a.pubkey} edge={8} /></td>
                        <td className="muted small">{a.signer ? "Signer" : "—"}</td>
                        <td className="right" style={{ color: a.delta > 0 ? "var(--green)" : a.delta < 0 ? "var(--red)" : "var(--text-muted)" }}>
                          {a.delta > 0 ? "+" : ""}{formatBbc(a.delta)}
                        </td>
                        <td className="right muted">{formatBbc(a.post)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {tx.logs.length > 0 && (
            <div className="section">
              <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>Program logs</h2>
              <div className="prose"><pre>{tx.logs.join("\n")}</pre></div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
