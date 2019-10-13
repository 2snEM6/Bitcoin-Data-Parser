declare module 'bitcoind' {
  import { ChildProcess } from 'child_process';

  interface BitcoindOptions {
    readonly testnet: boolean;
    readonly rpcport: number;
  }

  interface Node extends ChildProcess {
    readonly rpc: any;
  }

  export default function bitcoind(options: BitcoindOptions): Node;
}
