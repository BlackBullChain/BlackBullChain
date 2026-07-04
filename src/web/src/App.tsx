import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Explorer from "./pages/Explorer";
import Blocks from "./pages/Blocks";
import Transfers from "./pages/Transfers";
import Block from "./pages/Block";
import Tx from "./pages/Tx";
import Address from "./pages/Address";
import Wallet from "./pages/Wallet";
import Peg from "./pages/Peg";
import Docs from "./pages/Docs";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explorer" element={<Explorer />} />
        <Route path="/blocks" element={<Blocks />} />
        <Route path="/transfers" element={<Transfers />} />
        <Route path="/block/:slot" element={<Block />} />
        <Route path="/tx/:sig" element={<Tx />} />
        <Route path="/address/:addr" element={<Address />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/peg" element={<Peg />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Layout>
  );
}
