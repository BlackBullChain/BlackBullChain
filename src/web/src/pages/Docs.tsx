import { Link } from "react-router-dom";
import { CHAIN_NAME, TICKER } from "../lib/config";

function Code({ children }: { children: string }) {
  return <pre>{children}</pre>;
}

export default function Docs() {
  return (
    <div className="container page">
      <div className="docs-grid">
        <aside className="toc docs-toc">
          <div className="tiny dim" style={{ textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>On this page</div>
          <a href="#intro">What is {CHAIN_NAME}</a>
          <a href="#connect">Connect to the network</a>
          <a href="#wallet">Create a wallet</a>
          <a href="#send">Send &amp; receive {TICKER}</a>
          <a href="#validator">Host a validator</a>
          <a href="#ports">Ports &amp; networking</a>
        </aside>

        <div className="prose" style={{ minWidth: 0 }}>
          <h1>Documentation</h1>

          <section id="intro">
            <p>
              {CHAIN_NAME} is an independent, Solana-compatible Layer 1 built on a fork of the
              Agave validator client (v4.1.1). The native token is <b>{TICKER}</b>
              (1 {TICKER} = 1,000,000,000 lamports). Because the runtime is Solana-compatible,
              every Solana tool — <code>@solana/web3.js</code>, SPL tokens, wallets — works against
              a {CHAIN_NAME} RPC endpoint. The user-facing CLI is <code>blackbull</code>.
            </p>
          </section>

          <section id="connect">
            <h2>Connect to the network</h2>
            <p>Everything talks to a {CHAIN_NAME} <b>RPC endpoint</b> (default port 8899). In this
              site, set it via the connection badge in the top-right — for example your own node at
              <code> http://localhost:8899</code> or your Mac Mini over Tailscale.</p>
            <h3>From JavaScript</h3>
            <Code>{`import { Connection } from "@solana/web3.js";

const c = new Connection("http://YOUR_NODE_IP:8899", "confirmed");
console.log(await c.getEpochInfo());`}</Code>
            <h3>From the CLI</h3>
            <Code>{`blackbull config set --url http://YOUR_NODE_IP:8899
blackbull cluster-version
blackbull epoch-info`}</Code>
          </section>

          <section id="wallet">
            <h2>Create a wallet</h2>
            <p><b>In the browser:</b> open the <Link className="link" to="/wallet">Wallet</Link> page and click
              <i> Create wallet</i>. A keypair is generated and stored locally — copy your address to
              receive {TICKER}, and back up the secret key.</p>
            <p><b>With the CLI:</b></p>
            <Code>{`# generate a keypair file
blackbull-keygen new -o ~/bbc-wallet.json

# show its public address
blackbull address -k ~/bbc-wallet.json`}</Code>
            <p>You can import a CLI keypair into the browser wallet by pasting the JSON byte array
              from <code>~/bbc-wallet.json</code> into the wallet’s Import box.</p>
          </section>

          <section id="send">
            <h2>Send &amp; receive {TICKER}</h2>
            <p><b>Receive:</b> share your address — any sender can transfer {TICKER} to it. Watch it
              arrive in the <Link className="link" to="/explorer">explorer</Link>.</p>
            <p><b>Send in the browser:</b> on the Wallet page, paste the recipient address, enter an
              amount, and hit <i>Send {TICKER}</i>. You’ll get a signature you can open in the explorer.</p>
            <p><b>Send with the CLI:</b></p>
            <Code>{`# your balance
blackbull balance -k ~/bbc-wallet.json

# send 1.5 BBC
blackbull transfer RECIPIENT_ADDRESS 1.5 \\
  -k ~/bbc-wallet.json --allow-unfunded-recipient

# on a dev network, get test BBC from the faucet
blackbull airdrop 1 -k ~/bbc-wallet.json`}</Code>
          </section>

          <section id="validator">
            <h2>Host a validator</h2>
            <p>Anyone can run a {CHAIN_NAME} node. The reference target is a Mac Mini, but any
              Linux/macOS box with a fast SSD works. Build from source, then launch.</p>
            <h3>1. Build</h3>
            <Code>{`git clone https://github.com/BlackBullChain/BlackBullChain.git
cd BlackBullChain

# the rebrand is already applied in the repo (re-running is a no-op)
cd src/node && cargo build --release
# produces target/release/blackbull-validator, blackbull, blackbull-keygen, ...`}</Code>
            <h3>2. Genesis + launch the first validator</h3>
            <p>The bootstrap script creates the mint/faucet/validator keys, builds the genesis, and
              starts a block-producing node. Running it is the genesis event of the chain.</p>
            <Code>{`cd ../..                      # back to repo root
./scripts/bootstrap-validator.sh

# point it at your machine's LAN/Tailscale IP so others can peer:
GOSSIP_HOST=100.x.y.z ./scripts/bootstrap-validator.sh`}</Code>
            <h3>3. Join an existing network (extra validators)</h3>
            <Code>{`blackbull-validator \\
  --identity validator-keypair.json \\
  --vote-account vote-keypair.json \\
  --entrypoint BOOTSTRAP_HOST:8001 \\
  --rpc-port 8899 \\
  --ledger ledger \\
  --limit-ledger-size`}</Code>
          </section>

          <section id="ports">
            <h2>Ports &amp; networking</h2>
            <ul>
              <li><b>8899</b> — JSON-RPC (what wallets and this site connect to)</li>
              <li><b>8001</b> — gossip (peer discovery; set <code>--gossip-host</code> to a reachable IP)</li>
              <li><b>8000–8020</b> — TPU/TVU dynamic port range for consensus traffic</li>
              <li><b>9900</b> — faucet (dev networks only)</li>
            </ul>
            <p>For a Mac Mini at home, expose it privately over <b>Tailscale</b> and set
              <code> GOSSIP_HOST</code> to its Tailscale IP — no public port-forwarding needed.
              Open 8899 only to the peers/apps you trust.</p>
            <div className="notice warn" style={{ marginTop: 16 }}>
              Full node operation reference lives in the repo’s <code>docs/SPEC.md</code> and
              <code> scripts/bootstrap-validator.sh</code>.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
