import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";
import { getConnection, getBlockRaw } from "../lib/rpc";
import { useNetworkStats } from "../lib/hooks";
import { formatBbc, formatNumber, timeAgo } from "../lib/format";
import { StatCard, HashLink, Loading, Notice } from "../components/ui";

interface RecentBlock {
  slot: number;
  time: number | null;
  height: number | null;
  txCount: number;
}

function SearchBar() {
  const nav = useNavigate();
  const [q, setQ] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const v = q.trim();
    if (!v) return;
    if (/^\d+$/.test(v)) {
      nav(`/block/${v}`);
    } else if (v.length >= 80) {
      nav(`/tx/${v}`);
    } else {
      try {
        new PublicKey(v);
        nav(`/address/${v}`);
      } catch {
        nav(`/tx/${v}`);
      }
    }
    setQ("");
  }

  return (
    <form onSubmit={submit} className="row" style={{ gap: 8 }}>
      <input
        className="input mono"
        placeholder="Search by address, transaction signature, or slot number"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ flex: 1 }}
      />
      <button className="btn btn-primary" type="submit">Search</button>
    </form>
  );
}

function LatestBlocks() {
  const [blocks, setBlocks] = useState<RecentBlock[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const c = getConnection();
        const slot = await c.getSlot();
        const avail = await c.getBlocks(Math.max(0, slot - 30), slot);
        const recent = avail.slice(-10).reverse();
        const rows = await Promise.all(
          recent.map(async (s) => {
            const b = await getBlockRaw(s).catch(() => null);
            return {
              slot: s,
              time: b?.blockTime ?? null,
              height: b?.blockHeight ?? null,
              txCount: b?.signatures.length ?? 0,
            } as RecentBlock;
          }),
        );
        if (!alive) return;
        setBlocks(rows);
        setError(null);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      }
    }
    load();
    const t = setInterval(load, 6000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (error) return <Notice kind="err">Couldn’t load blocks: {error}</Notice>;
  if (!blocks) return <Loading label="Loading latest blocks…" />;
  if (blocks.length === 0) return <Notice>No blocks yet. Is the validator producing?</Notice>;

  return (
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
            {blocks.map((b) => (
              <tr key={b.slot}>
                <td><HashLink kind="block" value={b.slot} full /></td>
                <td>{b.height != null ? formatNumber(b.height) : "—"}</td>
                <td>{formatNumber(b.txCount)}</td>
                <td className="right muted">{timeAgo(b.time)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Explorer() {
  const { stats, error } = useNetworkStats(5000);

  return (
    <div className="container page">
      <h1 style={{ fontSize: "2rem" }}>Explorer</h1>
      <p className="muted" style={{ marginTop: 6 }}>Live view of the BlackBullChain network.</p>

      <div className="section" style={{ marginTop: 24 }}>
        <SearchBar />
      </div>

      {error && (
        <div className="section">
          <Notice kind="warn">
            Not connected to a node. Set your RPC endpoint using the badge in the top-right, or start a
            local node with <code>bootstrap-validator.sh</code>.
          </Notice>
        </div>
      )}

      <div className="section grid grid-4">
        <StatCard label="Slot" value={stats ? formatNumber(stats.slot) : "—"} />
        <StatCard
          label="Epoch"
          value={stats ? formatNumber(stats.epoch) : "—"}
          sub={stats ? `${(stats.epochProgress * 100).toFixed(1)}% complete` : undefined}
        />
        <StatCard label="Validators" value={stats?.validatorCount != null ? formatNumber(stats.validatorCount) : "—"} />
        <StatCard label="Total supply" value={stats?.totalSupplyLamports != null ? formatBbc(stats.totalSupplyLamports, 0) : "—"} />
        <StatCard label="Transactions" value={stats?.transactionCount != null ? formatNumber(stats.transactionCount) : "—"} />
      </div>

      <div className="section">
        <div className="spread" style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: "1.3rem" }}>Latest blocks</h2>
        </div>
        <LatestBlocks />
      </div>
    </div>
  );
}
