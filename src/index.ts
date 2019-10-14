import BitcoinCoreClient from "bitcoin-core";
import { script as Script } from "bitcoinjs-lib";
import { UniqueConstraintError } from 'sequelize';
import * as DB from "./db";
import { OPRETURN } from './db/models';

const OP_RETURN = 106;

const bitcoinCoreClient = new BitcoinCoreClient({
  network: 'testnet',
  username: process.env.BITCOIN_CORE_RPC_USERNAME,
  password: process.env.BITCOIN_CORE_RPC_PASSWORD
});

interface OPRETURNData {
  readonly data: string;
  readonly utxoIdx: number;
}

const parseOPRETURN = (tx: any): ReadonlyArray<OPRETURNData> => {
  // tslint:disable-next-line:readonly-array
  const opReturns = [];
  for (const vout of tx.vout) {
    if (vout.scriptPubKey.type !== 'nonstandard') {
      const parsedScript = Script.decompile(Buffer.from(vout.scriptPubKey.hex, 'hex'));
      if (parsedScript.length && parsedScript[0] === OP_RETURN) {
        const text = typeof parsedScript[1] === 'number'
          ? (parsedScript[1] as number).toString()
          : (parsedScript[1] as Buffer).toString('utf8');

        opReturns.push({
          data: text,
          utxoIdx: vout.n
        });
      }
    }
  }

  return opReturns;
};

const run = async () => {
  await DB.initialize(); // Setups DB schema

  const firstBlockHash = await bitcoinCoreClient.getBlockHash(0); // Update to the latest indexed block
  let currentBlockHash = await bitcoinCoreClient.getBestBlockHash();// Load from ZeroMQ

  while (currentBlockHash !== firstBlockHash) {
    const block = await bitcoinCoreClient.getBlock(currentBlockHash, 2) as any;

    // tslint:disable-next-line:readonly-array
    const opReturns = [];

    for (const tx of block.tx) {
      const opReturnDataList = parseOPRETURN(tx);

      for (const opReturnData of opReturnDataList) {
        opReturns.push({
          data: opReturnData.data,
          utxoIdx: opReturnData.utxoIdx,
          blockHash: currentBlockHash,
          txHash: tx.txid,
          height: block.height
        });
      }
    }

    try {
      await OPRETURN.bulkCreate(opReturns); // 1 database tx required for all possible OP_RETURNS within a block
      console.log(`Block ${block.height} parsing SUCCESS`);
    } catch (error) {
      if (!(error instanceof UniqueConstraintError)) {
        throw error;
      }
      console.log(`Block ${block.height} has already been parsed. Skipping...`);
    }

    currentBlockHash = block.previousblockhash;
  }
};

run();
