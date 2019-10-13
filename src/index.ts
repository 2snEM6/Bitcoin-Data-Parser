import bitcoind from 'bitcoind';

// start the full node
const node = bitcoind({
  // options are turned into CLI args
  testnet: true,
  rpcport: 18332
});

process.on("exit", () => {
  console.log('Killing Bitcoind node...');
  node.kill();
});

console.log(`Bitcoind testnet node started on PID: ${node.pid}`);


// // returns handle to child process
// node.stdout.pipe(process.stdout);

// comes with initialized rpc client
node.rpc.getNetworkInfo().then(console.log);
