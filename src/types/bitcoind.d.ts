interface BitcoindOptions {
  readonly testnet: boolean,
  readonly rpcport: number
}

declare module 'bitcoind' {
  export default function bitcoind(options: BitcoindOptions): void;
}
