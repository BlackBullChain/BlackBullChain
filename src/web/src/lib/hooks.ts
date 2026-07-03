import { useEffect, useState } from "react";
import { getConnection } from "./rpc";

export interface NetworkStats {
  slot: number;
  epoch: number;
  slotIndex: number;
  slotsInEpoch: number;
  epochProgress: number; // 0..1
  transactionCount: number | null;
  tps: number | null;
  validatorCount: number | null;
  totalSupplyLamports: number | null;
}

export function useNetworkStats(pollMs = 5000) {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const c = getConnection();
        const [epochInfo, perf, supply, voteAccounts, txCount] = await Promise.all([
          c.getEpochInfo(),
          c.getRecentPerformanceSamples(1).catch(() => []),
          c.getSupply().catch(() => null),
          c.getVoteAccounts().catch(() => null),
          c.getTransactionCount().catch(() => null),
        ]);
        if (!alive) return;
        const sample = perf[0];
        setStats({
          slot: epochInfo.absoluteSlot,
          epoch: epochInfo.epoch,
          slotIndex: epochInfo.slotIndex,
          slotsInEpoch: epochInfo.slotsInEpoch,
          epochProgress: epochInfo.slotIndex / epochInfo.slotsInEpoch,
          transactionCount: txCount ?? null,
          tps: sample ? Math.round(sample.numTransactions / sample.samplePeriodSecs) : null,
          validatorCount: voteAccounts
            ? voteAccounts.current.length + voteAccounts.delinquent.length
            : null,
          totalSupplyLamports: supply ? supply.value.total : null,
        });
        setError(null);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    const t = setInterval(load, pollMs);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [pollMs]);

  return { stats, error, loading };
}
