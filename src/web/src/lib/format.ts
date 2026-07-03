import { LAMPORTS_PER_BBC, TICKER } from "./config";

export function lamportsToBbc(lamports: number): number {
  return lamports / LAMPORTS_PER_BBC;
}

export function formatBbc(lamports: number, maximumFractionDigits = 9): string {
  return (
    lamportsToBbc(lamports).toLocaleString(undefined, { maximumFractionDigits }) + " " + TICKER
  );
}

export function formatNumber(n: number): string {
  return n.toLocaleString();
}

// Shorten a base58 address / signature for compact display.
export function shorten(s: string, edge = 4): string {
  if (!s) return "";
  return s.length <= edge * 2 + 1 ? s : `${s.slice(0, edge)}…${s.slice(-edge)}`;
}

export function timeAgo(unixSeconds?: number | null): string {
  if (!unixSeconds) return "—";
  const secs = Math.max(0, Math.floor(nowSeconds() - unixSeconds));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function formatTimestamp(unixSeconds?: number | null): string {
  if (!unixSeconds) return "—";
  return new Date(unixSeconds * 1000).toLocaleString();
}

function nowSeconds(): number {
  return Date.now() / 1000;
}
