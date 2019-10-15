import BitcoinCoreClient from 'bitcoin-core';
import { script as Script } from 'bitcoinjs-lib';
import * as Logger from 'bunyan';
import * as fs from 'fs';
import { DataTypes, Sequelize, UniqueConstraintError } from 'sequelize';
import { promisify } from 'util';
import { OPRETURN, OPRETURN as OPRETURNModel } from '../db/models';
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

interface ParsingLimits {
  start: {
    hash: string;
    height: number;
  };
  end: {
    hash: string;
    height: number;
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

    OPRETURN.init(
      {
        data: {
          type: new DataTypes.TEXT(),
          allowNull: false
        },
        blockHash: {
          primaryKey: true,
          type: new DataTypes.STRING(),
          allowNull: false
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
      },
      {
        indexes: [
          {
            fields: ['data'],
            using: 'gin',
            operator: 'gin_trgm_ops'
          }
        ],
        tableName: 'opreturns',
        sequelize: this.database
      }
    );

    this.logger.debug('Success');
    this.logger.debug('Syncing database');

    await OPRETURN.sync();

    this.logger.debug('Success');
    this.logger.debug('Successfully initialized Sequelize');
  }

  public async stop(): Promise<boolean> {
    if (!this.enabled) {
      this.logger.info('Unable to stop Parser. Parser is not running');
      return false;
    }
    this.enabled = false;
    await this.database.close();
    this.logger.info('Attempting to stop parser...');
    this.logger.debug('Database connection closed...');
    this.logger.info('Parser has been stopped successfully');

    return true;
  }

  public async run(): Promise<void> {
    this.enabled = true;

    try {
      const parsingLimits: ParsingLimits = await this.computeParsingLimits();

      this.logger.debug({ parsingLimits }, 'Begin parsing');

      const limitBlockHash = parsingLimits.end.hash;
      let currentBlockHash = parsingLimits.start.hash;

      while (this.enabled && currentBlockHash !== limitBlockHash) {
        const block = (await this.rpc.getBlock(currentBlockHash, 2)) as any;
        const opReturns = this.parseOPRETURNForBlock(block);

        this.logger.trace(
          { opReturns: opReturns.map(op => op.data) },
          'OPReturns ready to be saved'
        );

        try {
          await OPRETURNModel.bulkCreate(opReturns); // 1 database tx required for all possible OP_RETURNS within a block
          this.logger.debug(
            { hash: currentBlockHash, height: block.height },
            `Parsing block with height ${block.height}`
          );
        } catch (error) {
          if (!(error instanceof UniqueConstraintError)) {
            throw error;
          }

          this.logger.debug(
            { blockHash: currentBlockHash },
            'Block has already been parsed. Skipping...'
          );
        }

        currentBlockHash = block.previousblockhash;
      }

      if (currentBlockHash === limitBlockHash) {
        this.logger.info(
          { lastHash: currentBlockHash, limitHeight: parsingLimits.end.height },
          'Parsing completed. Reached limit indexing height'
        );
      }
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    } finally {
      this.enabled = false;
    }
  }

  private isParsingFromScratch(
    lowestIndexedHeight: number,
    highestIndexedHeight: number
  ): boolean {
    return (
      Number.isNaN(lowestIndexedHeight) && Number.isNaN(highestIndexedHeight)
    );
  }

  private parsingIsComplete(
    lowestIndexedHeight: number,
    indexingHeightLimit: number
  ): boolean {
    return lowestIndexedHeight === indexingHeightLimit;
  }

  private async computeParsingLimits(): Promise<ParsingLimits> {
    const defaultIndexingLimits = {
      height: networkConfig[this.network].indexingLimit,
      hash: await this.rpc.getBlockHash(
        networkConfig[this.network].indexingLimit
      )
    };

    const lowestIndexedHeight = (await OPRETURNModel.min('height')) as number;
    const highestIndexedHeight = (await OPRETURNModel.max('height')) as number;
    const bestBlockHash = await this.rpc.getBestBlockHash();
    const bestBlockHeight = ((await this.rpc.getBlock(bestBlockHash, 2)) as any)
      .height;

    if (bestBlockHeight < defaultIndexingLimits.height) {
      throw new Error(
        `Current best block height is below the desired indexing limit of ${defaultIndexingLimits.height}. Wait for synchronization`
      );
    }

    if (this.isParsingFromScratch(lowestIndexedHeight, highestIndexedHeight)) {
      return {
        start: {
          height: bestBlockHeight,
          hash: bestBlockHash
        },
        end: defaultIndexingLimits
      };
    }

    if (
      this.parsingIsComplete(lowestIndexedHeight, defaultIndexingLimits.height)
    ) {
      const highestIndexedHash = await this.rpc.getBlockHash(
        highestIndexedHeight
      );
      return {
        start: {
          height: bestBlockHeight,
          hash: bestBlockHash
        },
        end: {
          height: highestIndexedHeight,
          hash: highestIndexedHash
        }
      };
    }

    const lowestIndexedHash = await this.rpc.getBlockHash(lowestIndexedHeight);

    this.logger.debug('Initial parsing is not complete. Continuing...');

    return {
      start: {
        height: lowestIndexedHeight,
        hash: lowestIndexedHash
      },
      end: defaultIndexingLimits
    };
  }

  private async executeMigrations(): Promise<void> {
    this.logger.debug('Executing migrations...');
    const migrationsPath = './src/OPRETURNParser/migrations/';
    const fileList = await readdir(migrationsPath);

    for (const fileName of fileList) {
      const filePath = `${migrationsPath}${fileName}`;
      const fileContentBuffer = await readFile(filePath);
      const query = fileContentBuffer.toString('utf8');
      await this.database.query(query);
    }
    this.logger.debug('Migrations executed succesfully');
  }

  private initializeDatabaseClient(credentials: any): Sequelize {
    return new Sequelize(
      credentials.name,
      credentials.user,
      credentials.password,
      {
        dialect: 'postgres',
        logging: false
      }
    );
  }

  private initializeRPCClient(credentials: any): BitcoinCoreClient {
    return new BitcoinCoreClient(credentials);
  }

  private parseOPRETURNForTx(tx: any): any[] {
    const opReturns = [];
    for (const vout of tx.vout) {
      if (vout.scriptPubKey.type !== 'nonstandard') {
        // Skipping non-standard scripts
        const parsedScript = Script.decompile(
          Buffer.from(vout.scriptPubKey.hex, 'hex')
        );
        if (
          parsedScript.length &&
          parsedScript[0] &&
          parsedScript[1] &&
          parsedScript[0] === OP_CODES.OP_RETURN
        ) {
          const text =
            typeof parsedScript[1] === 'number'
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
    const opReturns: OPRETURNData[] = [];

    for (const tx of block.tx) {
      const opReturnDataList = this.parseOPRETURNForTx(tx);

      for (const opReturnData of opReturnDataList) {
        opReturns.push({
          ...opReturnData,
          blockHash: block.hash,
          txHash: tx.txid,
          height: block.height
        });
      }
    }

    return opReturns;
  }
}
