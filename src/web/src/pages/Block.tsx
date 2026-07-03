import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getConnection } from "../lib/rpc";
import type { BlockLite } from "../lib/types";
import { formatNumber, formatTimestamp, timeAgo } from "../lib/format";
import { HashLink, CopyButton, Loading, Notice } from "../components/ui";

interface BlockData {
  blockhash: string;
  previousBlockhash: string;
  parentSlot: number;
  blockHeight: number | null;
  blockTime: number | null;
  signatures: string[];
}

export default function Block() {
  const { slot } = useParams();
  const slotNum = Number(slot);
  const [data, setData] = useState<BlockData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    setData(null);
    (async () => {
      try {
        const b = (await getConnection().getBlock(slotNum, {
          transactionDetails: "signatures",
          rewards: false,
          maxSupportedTransactionVersion: 0,
        })) as unknown as BlockLite | null;
        if (!alive) return;
        if (!b) {
          setError("Block not found (the slot may be empty or skipped).");
        } else {
          setData({
            blockhash: b.blockhash,
            previousBlockhash: b.previousBlockhash,
            parentSlot: b.parentSlot,
            blockHeight: b.blockHeight ?? null,
            blockTime: b.blockTime ?? null,
            signatures: b.signatures ?? [],
          });
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slotNum]);

  return (
    <div className="container page">
      <div className="spread">
        <h1 style={{ fontSize: "1.8rem" }}>Block #{formatNumber(slotNum)}</h1>
        <div className="row">
          <Link className="btn btn-sm" to={`/block/${slotNum - 1}`}>← Prev</Link>
          <Link className="btn btn-sm" to={`/block/${slotNum + 1}`}>Next →</Link>
        </div>
      </div>

      {loading && <div className="section"><Loading /></div>}
      {error && <div className="section"><Notice kind="err">{error}</Notice></div>}

      {data && (
        <>
          <div className="card section">
            <div className="kv">
              <div className="k">Slot</div><div className="v">{formatNumber(slotNum)}</div>
              <div className="k">Block height</div><div className="v">{data.blockHeight != null ? formatNumber(data.blockHeight) : "—"}</div>
              <div className="k">Timestamp</div><div className="v">{formatTimestamp(data.blockTime)} <span className="muted">({timeAgo(data.blockTime)})</span></div>
              <div className="k">Blockhash</div><div className="v break mono small">{data.blockhash} <CopyButton text={data.blockhash} /></div>
              <div className="k">Parent slot</div><div className="v"><HashLink kind="block" value={data.parentSlot} full /></div>
              <div className="k">Transactions</div><div className="v">{formatNumber(data.signatures.length)}</div>
            </div>
          </div>

          <div className="section">
            <h2 style={{ fontSize: "1.3rem", marginBottom: 12 }}>Transactions</h2>
            {data.signatures.length === 0 ? (
              <Notice>No transactions in this block.</Notice>
            ) : (
              <div className="card" style={{ padding: 0 }}>
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>#</th><th>Signature</th></tr></thead>
                    <tbody>
                      {data.signatures.map((sig, i) => (
                        <tr key={sig}>
                          <td className="muted">{i + 1}</td>
                          <td><HashLink kind="tx" value={sig} full edge={10} /> <CopyButton text={sig} /></td>
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
