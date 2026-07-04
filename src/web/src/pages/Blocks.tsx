import { useCallback, useEffect, useRef, useState } from "react";
import { getConnection, getBlockRaw } from "../lib/rpc";
import { useNetworkStats } from "../lib/hooks";
import { formatNumber, timeAgo } from "../lib/format";
import { HashLink, Notice, Loading, StatCard } from "../components/ui";

interface Row {
  slot: number;
  height: number | null;
  txCount: number | null;
  time: number | null;
  fresh?: boolean;
}

const LIVE_CAP = 50; // rows kept in the live feed
const PAGE = 25; // blocks fetched per "load older" click

export default function Blocks() {
  const [rows, setRows] = useState<Row[]>([]);
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const seen = useRef<Set<number>>(new Set());
  // Once the user loads older history, stop trimming the list so their scroll-back persists.
  const extendedRef = useRef(false);
  const rowsRef = useRef<Row[]>([]);
  rowsRef.current = rows;
  const { stats } = useNetworkStats(5000);

  // Fill in height / tx-count / time for a slot once it's confirmed and available.
  const enrich = useCallback(async (slot: number) => {
    if (slot < 0) return;
    const b = await getBlockRaw(slot).catch(() => null);
    if (!b) return;
    setRows((prev) =>
      prev.map((r) =>
        r.slot === slot
          ? { ...r, height: b.blockHeight, txCount: b.signatures.length, time: b.blockTime }
          : r,
      ),
    );
  }, []);

  const seedRecent = useCallback(async () => {
    const c = getConnection();
    const slot = await c.getSlot();
    const avail = await c.getBlocks(Math.max(0, slot - 80), slot);
    const recent = avail.slice(-LIVE_CAP).reverse();
    seen.current = new Set(recent);
    setRows(recent.map((s) => ({ slot: s, height: null, txCount: null, time: null })));
    recent.forEach((s) => enrich(s));
  }, [enrich]);

  // Initial load + live slot subscription (WebSocket).
  useEffect(() => {
    let alive = true;
    let subId: number | null = null;
    const c = getConnection();

    seedRecent().catch((e) => {
      if (alive) setError(e instanceof Error ? e.message : String(e));
    });

    try {
      subId = c.onSlotChange((info) => {
        if (!alive) return;
        setLive(true);
        const s = info.slot;
        if (seen.current.has(s)) return;
        seen.current.add(s);
        setRows((prev) => {
          const next = [{ slot: s, height: null, txCount: null, time: null, fresh: true }, ...prev];
          // Keep the live feed bounded — unless the user has paged into history.
          return extendedRef.current ? next : next.slice(0, LIVE_CAP);
        });
        enrich(s - 2); // a couple slots back is confirmed & fetchable
      });
    } catch (e) {
      if (alive) setError(e instanceof Error ? e.message : String(e));
    }

    return () => {
      alive = false;
      if (subId != null) c.removeSlotChangeListener(subId).catch(() => {});
    };
  }, [enrich, seedRecent]);

  // Retry any rows still missing data — a block often isn't fetchable the instant it streams
  // in, so we re-ask on a timer until height/txs/age are filled.
  useEffect(() => {
    const t = setInterval(() => {
      rowsRef.current
        .filter((r) => r.height === null)
        .slice(0, 15) // bound per tick so we don't hammer the RPC
        .forEach((r) => enrich(r.slot));
    }, 2500);
    return () => clearInterval(t);
  }, [enrich]);

  // Page backwards through history (appends below; live stream keeps flowing at the top).
  const loadOlder = useCallback(async () => {
    extendedRef.current = true;
    setLoadingOlder(true);
    try {
      const c = getConnection();
      const oldest = rows.length ? rows[rows.length - 1].slot : await c.getSlot();
      const end = oldest - 1;
      if (end < 0) return;
      const start = Math.max(0, end - PAGE * 4);
      const avail = await c.getBlocks(start, end);
      const batch = avail.slice(-PAGE).reverse().filter((s) => !seen.current.has(s));
      batch.forEach((s) => seen.current.add(s));
      setRows((prev) => [...prev, ...batch.map((s) => ({ slot: s, height: null, txCount: null, time: null }))]);
      batch.forEach((s) => enrich(s));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingOlder(false);
    }
  }, [rows, enrich]);

  return (
    <div className="container page">
      <div className="spread" style={{ alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "2rem" }}>Blocks</h1>
          <p className="muted" style={{ marginTop: 6 }}>Every block produced on BlackBullChain — live, then all the way back.</p>
        </div>
        <span className="net-status" title="Live block stream">
          <span className={`dot ${live ? "pulse" : ""}`} style={{ color: live ? "var(--green)" : "var(--text-dim)" }} />
          {live ? "Live" : "Connecting…"}
        </span>
      </div>

      <div className="section grid grid-4">
        <StatCard label="Current slot" value={stats ? formatNumber(stats.slot) : "—"} />
        <StatCard
          label="Epoch"
          value={stats ? formatNumber(stats.epoch) : "—"}
          sub={stats ? `${(stats.epochProgress * 100).toFixed(1)}% complete` : undefined}
        />
        <StatCard label="Transactions" value={stats?.transactionCount != null ? formatNumber(stats.transactionCount) : "—"} />
        <StatCard label="Validators" value={stats?.validatorCount != null ? formatNumber(stats.validatorCount) : "—"} />
      </div>

      {error && (
        <div className="section">
          <Notice kind="err">Couldn’t load blocks: {error}</Notice>
        </div>
      )}

      <div className="section">
        <div className="spread" style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: "1.3rem" }}>Live block stream</h2>
        </div>

        {rows.length === 0 ? (
          <Loading label="Waiting for blocks…" />
        ) : (
          <>
            <div className="card" style={{ padding: 0 }}>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Slot</th>
                      <th>Block height</th>
                      <th>Txs</th>
                      <th className="right">Age</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((b) => (
                      <tr key={b.slot} className={b.fresh ? "row-fresh" : undefined}>
                        <td><HashLink kind="block" value={b.slot} full /></td>
                        <td>{b.height != null ? formatNumber(b.height) : "—"}</td>
                        <td>{b.txCount != null ? formatNumber(b.txCount) : <span className="muted">…</span>}</td>
                        <td className="right muted">{timeAgo(b.time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="center" style={{ marginTop: 16 }}>
              <button className="btn" onClick={loadOlder} disabled={loadingOlder}>
                {loadingOlder ? "Loading…" : "Load older blocks ↓"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
