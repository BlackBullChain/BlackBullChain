// Runtime shape of getBlock({ transactionDetails: "signatures" }). web3.js types the
// overload as the full block response, so we cast to this narrower, accurate shape.
export interface BlockLite {
  blockhash: string;
  previousBlockhash: string;
  parentSlot: number;
  blockHeight: number | null;
  blockTime: number | null;
  signatures: string[];
}
