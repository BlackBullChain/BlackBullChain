import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";
import { getConnection } from "../lib/rpc";
import { formatBbc, formatNumber, timeAgo } from "../lib/format";
import { HashLink, CopyButton, Loading, Notice } from "../components/ui";

interface SigRow {
  signature: string;
  slot: number;
  blockTime: number | null;
  err: boolean;
}

interface AddressView {
  lamports: number;
  owner: string | null;
  executable: boolean;
  space: number;
  exists: boolean;
  sigs: SigRow[];
}

export default function Address() {
  const { addr } = useParams();
  const [view, setView] = useState<AddressView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    setView(null);
    (async () => {
      let pk: PublicKey;
      try {
        pk = new PublicKey(addr!);
      } catch {
        setError("Not a valid BlackBullChain address.");
        setLoading(false);
        return;
      }
      try {
        const c = getConnection();
        const [lamports, info, sigs] = await Promise.all([
          c.getBalance(pk),
          c.getAccountInfo(pk),
          c.getSignaturesForAddress(pk, { limit: 25 }),
        ]);
        if (!alive) return;
        setView({
          lamports,
          owner: info?.owner.toBase58() ?? null,
          executable: info?.executable ?? false,
          space: info?.data.length ?? 0,
          exists: info != null,
          sigs: sigs.map((s) => ({
            signature: s.signature,
            slot: s.slot,
            blockTime: s.blockTime ?? null,
            err: s.err != null,
          })),
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
  }, [addr]);

  return (
    <div className="container page">
      <h1 style={{ fontSize: "1.5rem" }}>Address</h1>
      <div className="row" style={{ marginTop: 6 }}>
        <span className="mono small break muted">{addr}</span>
        <CopyButton text={addr ?? ""} />
      </div>

      {loading && <div className="section"><Loading /></div>}
      {error && <div className="section"><Notice kind="err">{error}</Notice></div>}

      {view && (
        <>
          <div className="section grid grid-2">
            <div className="card stat">
              <div className="label">Balance</div>
              <div className="value gold">{formatBbc(view.lamports)}</div>
            </div>
            <div className="card">
              <div className="kv">
                <div className="k">Type</div><div className="v">{view.executable ? "Program (executable)" : view.exists ? "Account" : "Empty / system"}</div>
                <div className="k">Owner</div><div className="v">{view.owner ? <HashLink kind="address" value={view.owner} edge={8} /> : "—"}</div>
                <div className="k">Data size</div><div className="v">{formatNumber(view.space)} bytes</div>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="spread" style={{ marginBottom: 12 }}>
              <h2 style={{ fontSize: "1.2rem" }}>Recent transactions</h2>
              <Link className="link small" to="/wallet">Send from wallet →</Link>
            </div>
            {view.sigs.length === 0 ? (
              <Notice>No transactions found for this address.</Notice>
            ) : (
              <div className="card" style={{ padding: 0 }}>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr><th>Signature</th><th>Slot</th><th>Status</th><th className="right">Age</th></tr>
                    </thead>
                    <tbody>
                      {view.sigs.map((s) => (
                        <tr key={s.signature}>
                          <td><HashLink kind="tx" value={s.signature} edge={10} /></td>
                          <td><HashLink kind="block" value={s.slot} full /></td>
                          <td>{s.err ? <span className="badge err"><span className="dot" />Failed</span> : <span className="badge ok"><span className="dot" />Success</span>}</td>
                          <td className="right muted">{timeAgo(s.blockTime)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
