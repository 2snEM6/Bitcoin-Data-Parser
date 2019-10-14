import BitcoinCoreClient from "bitcoin-core";
import { script as Script } from 'bitcoinjs-lib';
import * as Logger from 'bunyan';
import { UniqueConstraintError } from 'sequelize';
import { OPRETURN as OPRETURNModel } from '../db/models';
import OP_CODES  from './OPRETURN_codes';

const networkConfig = {
  testnet: {
    indexingLimit: 1000000
  },
  mainnet: {
    indexingLimit: 500000
  }
};

interface OPRETURNData {
  readonly data: string;
  readonly utxoIdx: number;
  readonly blockHash: string;
  readonly txHash: string;
  readonly height: number;
}

interface RPCCredentials {
  readonly username: string;
  readonly password: string;
}

export type BitcoinNetworks = 'testnet' | 'mainnet';

const initRPCClient = (network: BitcoinNetworks, credentials: RPCCredentials) : BitcoinCoreClient => {
  return new BitcoinCoreClient({
    ...credentials,
    network,
  });
};

const parseOPRETURNForBlock = (block: any): OPRETURNData[] => {
  const opReturns : OPRETURNData[] = [];

  for (const tx of block.tx) {
    const opReturnDataList = parseOPRETURNForTx(tx);

    for (const opReturnData of opReturnDataList) {
      opReturns.push({
        ...opReturnData,
        blockHash: block.hash,
        txHash: tx.txid,
        height: block.height,
      });
    }
  }

  return opReturns;
};

const parseOPRETURNForTx = (tx: any): any[] => {
  const opReturns = [];
  for (const vout of tx.vout) {
    if (vout.scriptPubKey.type !== 'nonstandard') { // Skipping non-standard scripts
      const parsedScript = Script.decompile(Buffer.from(vout.scriptPubKey.hex, 'hex'));
      if (parsedScript.length && parsedScript[0] && parsedScript[1] && parsedScript[0] === OP_CODES.OP_RETURN) {
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


export const parse = async (logger: Logger, network: BitcoinNetworks, rpcCredentials: RPCCredentials) => {
  logger.debug('Initializing RPC Client');
  const RPCClient = initRPCClient(network, rpcCredentials);

  logger.debug('Success');

  const { indexingLimit } = networkConfig[network];
  const limitBlockHash = await RPCClient.getBlockHash(indexingLimit);
  let currentBlockHash = await RPCClient.getBestBlockHash();// Load from ZeroMQ

  logger.debug({ startingHash: currentBlockHash }, 'Begin parsing');

  while (currentBlockHash !== limitBlockHash) {
    const block = await RPCClient.getBlock(currentBlockHash, 2) as any;

    const opReturns = parseOPRETURNForBlock(block);

    logger.trace({ opReturns: opReturns.map(op => op.data) }, 'OPReturns ready to be saved');
    try {
      await OPRETURNModel.bulkCreate(opReturns); // 1 database tx required for all possible OP_RETURNS within a block
      logger.debug({ blockHash: currentBlockHash }, 'Parsing block');
    } catch (error) {
      if (!(error instanceof UniqueConstraintError)) {
        throw error;
      }
      logger.debug({ blockHash: currentBlockHash },'Block has already been parsed. Skipping...');
    }

    currentBlockHash = block.previousblockhash;
  }

  logger.debug({ lastHash: currentBlockHash }, 'Parsing completed');
};
