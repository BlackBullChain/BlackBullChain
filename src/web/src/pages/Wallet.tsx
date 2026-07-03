import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Keypair } from "@solana/web3.js";
import { getConnection } from "../lib/rpc";
import { TICKER } from "../lib/config";
import { formatBbc } from "../lib/format";
import {
  createWallet,
  exportSecretBase58,
  exportSecretJson,
  forgetWallet,
  importSecret,
  loadWallet,
  requestAirdrop,
  sendBbc,
} from "../lib/wallet";
import { CopyButton, Notice, Spinner } from "../components/ui";

type Msg = { ok: boolean; text: string; sig?: string } | null;

export default function Wallet() {
  const [kp, setKp] = useState<Keypair | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [balErr, setBalErr] = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  const [reveal, setReveal] = useState(false);

  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState<Msg>(null);
  const [airMsg, setAirMsg] = useState<Msg>(null);
  const [airdropping, setAirdropping] = useState(false);

  useEffect(() => setKp(loadWallet()), []);

  const refresh = useCallback(async () => {
    if (!kp) return;
    try {
      setBalErr(null);
      setBalance(await getConnection().getBalance(kp.publicKey));
    } catch (e) {
      setBalErr(e instanceof Error ? e.message : String(e));
    }
  }, [kp]);

  useEffect(() => {
    if (!kp) return;
    refresh();
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, [kp, refresh]);

  function onImport() {
    try {
      setKp(importSecret(importText));
      setImportText("");
    } catch {
      alert("Could not import — expected a base58 secret key or a JSON byte array.");
    }
  }

  async function doSend() {
    if (!kp) return;
    setSending(true);
    setSendMsg(null);
    try {
      const sig = await sendBbc(getConnection(), kp, to.trim(), parseFloat(amount));
      setSendMsg({ ok: true, text: "Sent!", sig });
      setTo("");
      setAmount("");
      refresh();
    } catch (e) {
      setSendMsg({ ok: false, text: e instanceof Error ? e.message : String(e) });
    } finally {
      setSending(false);
    }
  }

  async function doAirdrop() {
    if (!kp) return;
    setAirdropping(true);
    setAirMsg(null);
    try {
      const sig = await requestAirdrop(getConnection(), kp.publicKey, 1);
      setAirMsg({ ok: true, text: "Airdropped 1 " + TICKER, sig });
      refresh();
    } catch (e) {
      setAirMsg({ ok: false, text: "Airdrop failed (only works on dev networks with a faucet): " + (e instanceof Error ? e.message : String(e)) });
    } finally {
      setAirdropping(false);
    }
  }

  // ---- no wallet yet ----
  if (!kp) {
    return (
      <div className="container page" style={{ maxWidth: 620 }}>
        <h1 style={{ fontSize: "1.8rem" }}>Wallet</h1>
        <p className="muted" style={{ marginTop: 6 }}>Create a {TICKER} wallet in your browser, or import an existing key.</p>

        <div className="card section center" style={{ padding: "34px 20px" }}>
          <div style={{ fontSize: 30 }}>🐂</div>
          <h2 style={{ marginTop: 8, fontSize: "1.3rem" }}>New wallet</h2>
          <p className="muted small" style={{ marginTop: 6 }}>Generates a fresh keypair stored locally in this browser.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setKp(createWallet())}>Create wallet</button>
        </div>

        <div className="card section">
          <h3>Import existing key</h3>
          <p className="muted small" style={{ marginTop: 4 }}>Paste a base58 secret key, or a JSON byte array from <code>blackbull-keygen</code>.</p>
          <textarea className="textarea mono" style={{ marginTop: 10 }} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="[12,34,...]  or  base58 secret key" />
          <button className="btn" style={{ marginTop: 10 }} disabled={!importText.trim()} onClick={onImport}>Import</button>
        </div>
      </div>
    );
  }

  const address = kp.publicKey.toBase58();

  // ---- active wallet ----
  return (
    <div className="container page" style={{ maxWidth: 720 }}>
      <div className="spread">
        <h1 style={{ fontSize: "1.8rem" }}>Wallet</h1>
        <button className="btn btn-sm btn-danger" onClick={() => { if (confirm("Remove this wallet from the browser? Make sure you've backed up your secret key.")) { forgetWallet(); setKp(null); } }}>Forget</button>
      </div>

      <div className="card section">
        <div className="spread">
          <div>
            <div className="tiny dim" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>Balance</div>
            <div style={{ fontSize: "2.1rem", fontWeight: 700 }} className="gold">{balance != null ? formatBbc(balance) : "—"}</div>
          </div>
          <button className="btn btn-sm" onClick={refresh}>↻ Refresh</button>
        </div>
        {balErr && <div className="tiny" style={{ color: "var(--red)", marginTop: 8 }}>Can’t reach node: {balErr}</div>}
        <div className="divider" style={{ margin: "16px 0" }} />
        <div className="tiny dim" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>Your address (receive {TICKER} here)</div>
        <div className="row" style={{ marginTop: 6 }}>
          <span className="mono small break">{address}</span>
          <CopyButton text={address} />
          <Link className="link tiny" to={`/address/${address}`}>view in explorer →</Link>
        </div>
      </div>

      <div className="section grid grid-2" style={{ alignItems: "start" }}>
        {/* Send */}
        <div className="card">
          <h3>Send {TICKER}</h3>
          <label className="field-label" style={{ marginTop: 12 }}>Recipient address</label>
          <input className="input mono" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Recipient's BBC address" />
          <label className="field-label" style={{ marginTop: 12 }}>Amount ({TICKER})</label>
          <input className="input" type="number" min="0" step="0.000000001" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" />
          <button className="btn btn-primary" style={{ marginTop: 14, width: "100%" }} disabled={sending || !to.trim() || !(parseFloat(amount) > 0)} onClick={doSend}>
            {sending ? <><Spinner /> Sending…</> : `Send ${TICKER}`}
          </button>
          {sendMsg && (
            <div style={{ marginTop: 12 }}>
              <Notice kind={sendMsg.ok ? "ok" : "err"}>
                {sendMsg.text}{" "}
                {sendMsg.sig && <Link className="link" to={`/tx/${sendMsg.sig}`}>view transaction →</Link>}
              </Notice>
            </div>
          )}
        </div>

        {/* Receive / faucet */}
        <div className="card">
          <h3>Receive {TICKER}</h3>
          <p className="muted small" style={{ marginTop: 8 }}>Share your address above — anyone can send you {TICKER}.</p>
          <div className="divider" style={{ margin: "16px 0" }} />
          <h3>Faucet (dev networks)</h3>
          <p className="muted small" style={{ marginTop: 8 }}>Request test {TICKER} from the node’s faucet.</p>
          <button className="btn" style={{ marginTop: 12 }} disabled={airdropping} onClick={doAirdrop}>
            {airdropping ? <><Spinner /> Requesting…</> : `Airdrop 1 ${TICKER}`}
          </button>
          {airMsg && (
            <div style={{ marginTop: 12 }}>
              <Notice kind={airMsg.ok ? "ok" : "err"}>
                {airMsg.text}{" "}
                {airMsg.sig && <Link className="link" to={`/tx/${airMsg.sig}`}>view →</Link>}
              </Notice>
            </div>
          )}
        </div>
      </div>

      {/* Backup */}
      <div className="card section">
        <div className="spread">
          <h3>Backup / export</h3>
          <button className="btn btn-sm" onClick={() => setReveal((r) => !r)}>{reveal ? "Hide" : "Reveal secret key"}</button>
        </div>
        <Notice kind="warn"><b>Never share your secret key.</b> Anyone with it controls this wallet. This is a browser wallet for dev/test use.</Notice>
        {reveal && (
          <div style={{ marginTop: 12 }}>
            <label className="field-label">Base58 secret key</label>
            <div className="row"><span className="mono tiny break">{exportSecretBase58(kp)}</span><CopyButton text={exportSecretBase58(kp)} /></div>
            <label className="field-label" style={{ marginTop: 12 }}>JSON byte array (blackbull-keygen format)</label>
            <div className="row"><span className="mono tiny break">{exportSecretJson(kp)}</span><CopyButton text={exportSecretJson(kp)} /></div>
          </div>
        )}
      </div>
    </div>
  );
}
