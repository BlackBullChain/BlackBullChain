import { useEffect, useMemo, useState } from "react";
import { Keypair } from "@solana/web3.js";
import { TICKER } from "../lib/config";
import { exportSecretBase58, exportSecretJson, importSecret, saveWallet } from "../lib/wallet";
import { CopyButton, Notice } from "./ui";

type Mode = "create" | "import";

function ModalHead({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="modal-head">
      <h3>{title}</h3>
      <button className="modal-x" onClick={onClose} aria-label="Close">×</button>
    </div>
  );
}

function CreateFlow({ onReady, onClose }: { onReady: (kp: Keypair) => void; onClose: () => void }) {
  const kp = useMemo(() => Keypair.generate(), []);
  const [saved, setSaved] = useState(false);
  const address = kp.publicKey.toBase58();
  const secret = exportSecretBase58(kp);

  function download() {
    const blob = new Blob([exportSecretJson(kp)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "blackbull-wallet.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <ModalHead title="Create wallet" onClose={onClose} />
      <p className="muted small">
        Self-custody, right in your browser — no sign-up, no connecting anything. You hold the keys.
      </p>

      <div className="field-label" style={{ marginTop: 16 }}>Your {TICKER} address</div>
      <div className="secret-box">
        <span>{address}</span>
        <CopyButton text={address} />
      </div>

      <div className="field-label" style={{ marginTop: 16 }}>Your private key</div>
      <div className="secret-box">
        <span>{secret}</span>
        <CopyButton text={secret} />
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn btn-sm" onClick={download}>⬇ Download key file</button>
      </div>

      <div style={{ marginTop: 14 }}>
        <Notice kind="warn">
          <b>Save this now — it’s shown once and never again.</b> Anyone with this key controls your
          {" "}{TICKER}. There is no reset and no recovery.
        </Notice>
      </div>

      <label className="checkbox-row">
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
        <span>I’ve saved my private key somewhere safe. I understand it won’t be shown again.</span>
      </label>

      <button
        className="btn btn-primary"
        style={{ width: "100%" }}
        disabled={!saved}
        onClick={() => {
          saveWallet(kp);
          onReady(kp);
        }}
      >
        Open my wallet
      </button>
    </>
  );
}

function ImportFlow({ onReady, onClose }: { onReady: (kp: Keypair) => void; onClose: () => void }) {
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function doImport() {
    try {
      onReady(importSecret(text));
    } catch {
      setErr("Couldn’t import — paste a base58 private key, or a JSON byte array from blackbull-keygen.");
    }
  }

  return (
    <>
      <ModalHead title="Import wallet" onClose={onClose} />
      <p className="muted small">Paste your private key (base58) or a JSON byte array.</p>
      <textarea
        className="textarea mono"
        style={{ marginTop: 12 }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="[12,34,...]  or  base58 private key"
      />
      {err && <div style={{ marginTop: 10 }}><Notice kind="err">{err}</Notice></div>}
      <button
        className="btn btn-primary"
        style={{ width: "100%", marginTop: 14 }}
        disabled={!text.trim()}
        onClick={doImport}
      >
        Import wallet
      </button>
    </>
  );
}

export function WalletModal({ mode, onClose, onReady }: { mode: Mode; onClose: () => void; onReady: (kp: Keypair) => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {mode === "create" ? (
          <CreateFlow onReady={onReady} onClose={onClose} />
        ) : (
          <ImportFlow onReady={onReady} onClose={onClose} />
        )}
      </div>
    </div>
  );
}
