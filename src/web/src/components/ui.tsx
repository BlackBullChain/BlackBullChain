import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { shorten } from "../lib/format";

export function Spinner() {
  return <span className="spinner" aria-label="loading" />;
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="row" style={{ color: "var(--text-muted)", padding: "20px 0" }}>
      <Spinner /> <span>{label}</span>
    </div>
  );
}

export function Notice({ kind = "warn", children }: { kind?: "warn" | "err" | "ok"; children: ReactNode }) {
  return <div className={`notice ${kind}`}>{children}</div>;
}

export function StatCard({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="card stat">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {sub && <div className="tiny dim" style={{ marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="copy"
      title="Copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      {done ? "✓" : "⧉"}
    </button>
  );
}

type HashKind = "tx" | "address" | "block";

export function HashLink({ kind, value, full = false, edge = 6 }: { kind: HashKind; value: string | number; full?: boolean; edge?: number }) {
  const s = String(value);
  const to = kind === "tx" ? `/tx/${s}` : kind === "address" ? `/address/${s}` : `/block/${s}`;
  return (
    <Link className="hashlink" to={to}>
      {full ? s : shorten(s, edge)}
    </Link>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="card center muted" style={{ padding: "36px 20px" }}>{children}</div>;
}
