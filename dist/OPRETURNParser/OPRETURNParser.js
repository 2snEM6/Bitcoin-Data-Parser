"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const bitcoin_core_1 = __importDefault(require("bitcoin-core"));
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const fs = __importStar(require("fs"));
const sequelize_1 = require("sequelize");
const util_1 = require("util");
const models_1 = require("./models");
const OPRETURN_codes_1 = __importDefault(require("./OPRETURN_codes"));
const readFile = util_1.promisify(fs.readFile);
const readdir = util_1.promisify(fs.readdir);
const networkConfig = {
    testnet: {
        indexingLimit: 1000000
    },
    mainnet: {
        indexingLimit: 500000
    }
};
class OPRETURNParser {
    constructor(logger, options) {
        this.logger = logger;
        this.database = this.initializeDatabaseClient(options.database);
        this.logger.debug('Initializing RPC Client');
        this.rpc = this.initializeRPCClient(options.rpc);
        this.logger.debug('Success');
        this.network = options.rpc.network;
        this.enabled = false;
    }
    async initialize() {
        await this.executeMigrations();
        models_1.OPRETURN.init({
            data: {
                type: new sequelize_1.DataTypes.TEXT(),
                allowNull: false,
            },
            blockHash: {
                primaryKey: true,
                type: new sequelize_1.DataTypes.STRING(),
                allowNull: false,
            },
            txHash: {
                primaryKey: true,
                type: new sequelize_1.DataTypes.STRING(),
                allowNull: false
            },
            utxoIdx: {
                primaryKey: true,
                type: new sequelize_1.DataTypes.INTEGER(),
                allowNull: false
            },
            height: {
                type: new sequelize_1.DataTypes.INTEGER(),
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
        await models_1.OPRETURN.sync();
        this.logger.debug('Success');
        this.logger.debug('Successfully initialized Sequelize');
    }
    async stop() {
        if (!this.enabled) {
            return this.logger.info('Unable to stop Parser. Parser is not running');
        }
        this.enabled = false;
        await this.database.close();
        this.logger.info('Attempting to stop parser...');
        this.logger.debug('Database connection closed...');
        this.logger.info('Parser has been stopped successfully');
    }
    async run() {
        this.enabled = true;
        try {
            const { indexingLimit } = networkConfig[this.network];
            const lowestHeight = await models_1.OPRETURN.min("height");
            const limit = Math.min(indexingLimit, lowestHeight);
            const limitBlockHash = await this.rpc.getBlockHash(limit);
            let currentBlockHash = await this.rpc.getBestBlockHash(); // Load from ZeroMQ
            this.logger.debug({ startingHash: currentBlockHash }, 'Begin parsing');
            while (this.enabled && currentBlockHash !== limitBlockHash) {
                const block = await this.rpc.getBlock(currentBlockHash, 2);
                const opReturns = this.parseOPRETURNForBlock(block);
                this.logger.trace({ opReturns: opReturns.map(op => op.data) }, 'OPReturns ready to be saved');
                try {
                    await models_1.OPRETURN.bulkCreate(opReturns); // 1 database tx required for all possible OP_RETURNS within a block
                    this.logger.debug({ blockHash: currentBlockHash }, 'Parsing block');
                }
                catch (error) {
                    if (!(error instanceof sequelize_1.UniqueConstraintError)) {
                        throw error;
                    }
                    this.logger.debug({ blockHash: currentBlockHash }, 'Block has already been parsed. Skipping...');
                }
                currentBlockHash = block.previousblockhash;
            }
            if (currentBlockHash === limitBlockHash) {
                this.logger.info({ lastHash: currentBlockHash, limitHeight: indexingLimit }, 'Parsing completed. Reached limit indexing height');
            }
        }
        finally {
            this.enabled = false;
        }
    }
    async executeMigrations() {
        const migrationsPath = './src/OPRETURNParser/migrations/';
        const fileList = await readdir(migrationsPath);
        for (const fileName of fileList) {
            const filePath = `${migrationsPath}${fileName}`;
            const fileContentBuffer = await readFile(filePath);
            const query = fileContentBuffer.toString('utf8');
            await this.database.query(query);
        }
    }
    initializeDatabaseClient(credentials) {
        return new sequelize_1.Sequelize(credentials.name, credentials.user, credentials.password, {
            dialect: 'postgres',
            logging: false,
        });
    }
    initializeRPCClient(credentials) {
        return new bitcoin_core_1.default(credentials);
    }
    parseOPRETURNForTx(tx) {
        const opReturns = [];
        for (const vout of tx.vout) {
            if (vout.scriptPubKey.type !== 'nonstandard') { // Skipping non-standard scripts
                const parsedScript = bitcoinjs_lib_1.script.decompile(Buffer.from(vout.scriptPubKey.hex, 'hex'));
                if (parsedScript.length && parsedScript[0] && parsedScript[1] && parsedScript[0] === OPRETURN_codes_1.default.OP_RETURN) {
                    const text = typeof parsedScript[1] === 'number'
                        ? parsedScript[1].toString()
                        : parsedScript[1].toString('utf8');
                    opReturns.push({
                        data: text,
                        utxoIdx: vout.n
                    });
                }
            }
        }
        return opReturns;
    }
    parseOPRETURNForBlock(block) {
        const opReturns = [];
        for (const tx of block.tx) {
            const opReturnDataList = this.parseOPRETURNForTx(tx);
            for (const opReturnData of opReturnDataList) {
                opReturns.push(Object.assign(Object.assign({}, opReturnData), { blockHash: block.hash, txHash: tx.txid, height: block.height }));
            }
        }
        return opReturns;
    }
}
exports.OPRETURNParser = OPRETURNParser;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiT1BSRVRVUk5QYXJzZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvT1BSRVRVUk5QYXJzZXIvT1BSRVRVUk5QYXJzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsZ0VBQTZDO0FBQzdDLGlEQUFpRDtBQUVqRCx1Q0FBeUI7QUFDekIseUNBQXdFO0FBQ3hFLCtCQUFpQztBQUNqQyxxQ0FBK0Q7QUFDL0Qsc0VBQXdDO0FBRXhDLE1BQU0sUUFBUSxHQUFHLGdCQUFTLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3hDLE1BQU0sT0FBTyxHQUFHLGdCQUFTLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBR3RDLE1BQU0sYUFBYSxHQUFHO0lBQ3BCLE9BQU8sRUFBRTtRQUNQLGFBQWEsRUFBRSxPQUFPO0tBQ3ZCO0lBQ0QsT0FBTyxFQUFFO1FBQ1AsYUFBYSxFQUFFLE1BQU07S0FDdEI7Q0FDRixDQUFDO0FBMEJGLE1BQWEsY0FBYztJQU96QixZQUFZLE1BQWMsRUFBRSxPQUE4QjtRQUN4RCxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDaEUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM3QyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDakQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDN0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQztRQUNuQyxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztJQUN2QixDQUFDO0lB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