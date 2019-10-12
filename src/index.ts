import bitcoind from 'bitcoind';

// start the full node
const node = bitcoind({
  // options are turned into CLI args
  testnet: true,
  rpcport: 12345
});

// returns handle to child process
node.stdout.pipe(process.stdout);

// comes with initialized rpc client
node.rpc.getNetworkInfo().then(console.log);
