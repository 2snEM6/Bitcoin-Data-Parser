import BitcoinCoreClient from "bitcoin-core";
import { script as Script } from "bitcoinjs-lib";
import * as fs from 'fs';
import { DataTypes, Model, Sequelize } from "sequelize";
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);


// tslint:disable-next-line:no-class
class OPRETURN extends Model {
  // tslint:disable-next-line:readonly-keyword
  public data!: number;
  // tslint:disable-next-line:readonly-keyword
  public utxoIdx!: number;
  // tslint:disable-next-line:readonly-keyword
  public blockHash!: string;
  // tslint:disable-next-line:readonly-keyword
  public txHash!: string;
}

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
  console.log(tx);
  for (const vout of tx.vout) {
    console.log(vout);
    if (vout.scriptPubKey.type !== 'nonstandard') {
      const parsedScript = Script.decompile(Buffer.from(vout.scriptPubKey.hex, 'hex'));
      if (parsedScript.length && parsedScript[0] === OP_RETURN) {
        console.log(parsedScript);
        console.log(vout.scriptPubKey.asm);

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

const executeMigrations = async (sequelize: Sequelize) => {
  const fileList = await readdir('../migrations');

  for (const fileName of fileList) {
    console.log(`Executing migration: ${fileName}`);
    const filePath = `../migrations/${fileName}`;
    const fileContentBuffer = await readFile(filePath);
    const query = fileContentBuffer.toString('utf8');
    await sequelize.query(query);
  }
};

const setupDBSchema = async () => {
  const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: 'postgres',
    logging: false,
  });

  await executeMigrations(sequelize);

  OPRETURN.init({
    data: {
      type: new DataTypes.STRING(),
      allowNull: false,
    },
    blockHash: {
      primaryKey: true,
      type: new DataTypes.STRING(),
      allowNull: false,
    },
    txHash: {
      primaryKey: true,
      type: new DataTypes.STRING(),
      allowNull: false
    },
    utxoIdx: {
      primaryKey: true,
      type: new DataTypes.INTEGER(),
      allowNull: false
    }
  }, {
    indexes: [
      {
        fields: ['data'],
        using: 'gin',
        operator: 'gin_trgm_ops'
      }
    ],
    tableName: 'opreturns',
    sequelize
  });

  await OPRETURN.sync();
};


const mainParallel = async () => {
  await setupDBSchema();

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
          txHash: tx.txid
        });
      }
    }

    await OPRETURN.bulkCreate(opReturns); // 1 database tx required for all possible OP_RETURNS within a block

    currentBlockHash = block.previousblockhash;
  }
};

mainParallel();
