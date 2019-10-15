import BitcoinCoreClient from "bitcoin-core";
import { script as Script } from 'bitcoinjs-lib';
import * as Logger from 'bunyan';
import * as fs from 'fs';
import { DataTypes, Sequelize, UniqueConstraintError } from 'sequelize';
import { promisify } from 'util';
import { OPRETURN, OPRETURN as OPRETURNModel } from './models';
import OP_CODES from './OPRETURN_codes';

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);


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

export interface OPReturnParserOptions {
  readonly database: {
    readonly user: string;
    readonly password: string;
    readonly name: string;
  };

  readonly rpc: {
    readonly network: network;
    readonly username: string;
    readonly password: string;
  };
}

export type network = 'testnet' | 'mainnet';

export class OPRETURNParser {
  private readonly database: Sequelize;
  private readonly logger: Logger;
  private readonly rpc: BitcoinCoreClient;
  private readonly network: network;
  private enabled: boolean;

  constructor(logger: Logger, options: OPReturnParserOptions) {
    this.logger = logger;
    this.database = this.initializeDatabaseClient(options.database);
    this.logger.debug('Initializing RPC Client');
    this.rpc = this.initializeRPCClient(options.rpc);
    this.logger.debug('Success');
    this.network = options.rpc.network;
    this.enabled = false;
  }

  public async initialize(): Promise<void> {
    await this.executeMigrations();

    OPRETURN.init({
      data: {
        type: new DataTypes.TEXT(),
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
      },
      height: {
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
      sequelize: this.database
    });

    this.logger.debug('Success');
    this.logger.debug('Syncing database');

    await OPRETURN.sync();

    this.logger.debug('Success');
    this.logger.debug('Successfully initialized Sequelize');
  }

  public async stop(): Promise<void> {
    if (!this.enabled) {
      return this.logger.info('Unable to stop Parser. Parser is not running');
    }
    this.enabled = false;
    await this.database.close();
    this.logger.info('Attempting to stop parser...');
    this.logger.debug('Database connection closed...');
    this.logger.info('Parser has been stopped successfully');
  }

  public async run(): Promise<void> {
    this.enabled = true;

    try {
      const { indexingLimit } = networkConfig[this.network];
      const lowestHeight = await OPRETURNModel.min("height") as number;

      const limit = Math.min(indexingLimit, lowestHeight);

      const limitBlockHash = await this.rpc.getBlockHash(limit);
      let currentBlockHash = await this.rpc.getBestBlockHash();// Load from ZeroMQ

      this.logger.debug({ startingHash: currentBlockHash }, 'Begin parsing');

      while (this.enabled && currentBlockHash !== limitBlockHash) {
        const block = await this.rpc.getBlock(currentBlockHash, 2) as any;

        const opReturns = this.parseOPRETURNForBlock(block);

        this.logger.trace({ opReturns: opReturns.map(op => op.data) }, 'OPReturns ready to be saved');
        try {
          await OPRETURNModel.bulkCreate(opReturns); // 1 database tx required for all possible OP_RETURNS within a block
          this.logger.debug({ blockHash: currentBlockHash }, 'Parsing block');
        } catch (error) {
          if (!(error instanceof UniqueConstraintError)) {
            throw error;
          }
          this.logger.debug({ blockHash: currentBlockHash }, 'Block has already been parsed. Skipping...');
        }

        currentBlockHash = block.previousblockhash;
      }

      if (currentBlockHash === limitBlockHash) {
        this.logger.info({ lastHash: currentBlockHash, limitHeight: indexingLimit }, 'Parsing completed. Reached limit indexing height');
      }
    } finally {
      this.enabled = false;
    }
  }

  private async executeMigrations(): Promise<void> {
    const migrationsPath = './src/OPRETURNParser/migrations/';
    const fileList = await readdir(migrationsPath);

    for (const fileName of fileList) {
      const filePath = `${migrationsPath}${fileName}`;
      const fileContentBuffer = await readFile(filePath);
      const query = fileContentBuffer.toString('utf8');
      await this.database.query(query);
    }
  }


  private initializeDatabaseClient(credentials: any): Sequelize {
    return new Sequelize(credentials.name, credentials.user, credentials.password, {
      dialect: 'postgres',
      logging: false,
    });
  }

  private initializeRPCClient(credentials: any): BitcoinCoreClient {
    return new BitcoinCoreClient(credentials);
  }

  private parseOPRETURNForTx(tx: any): any[] {
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
  }

  private parseOPRETURNForBlock(block: any): OPRETURNData[] {
    const opReturns : OPRETURNData[] = [];

    for (const tx of block.tx) {
      const opReturnDataList = this.parseOPRETURNForTx(tx);

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
  }
}
