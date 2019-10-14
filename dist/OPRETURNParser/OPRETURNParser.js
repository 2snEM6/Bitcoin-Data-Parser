"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bitcoin_core_1 = __importDefault(require("bitcoin-core"));
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const sequelize_1 = require("sequelize");
const models_1 = require("../db/models");
const OPRETURN_codes_1 = __importDefault(require("./OPRETURN_codes"));
const networkConfig = {
    testnet: {
        indexingLimit: 1000000
    },
    mainnet: {
        indexingLimit: 500000
    }
};
const initRPCClient = (network, credentials) => {
    return new bitcoin_core_1.default(Object.assign(Object.assign({}, credentials), { network }));
};
const parseOPRETURNForBlock = (block) => {
    const opReturns = [];
    for (const tx of block.tx) {
        const opReturnDataList = parseOPRETURNForTx(tx);
        for (const opReturnData of opReturnDataList) {
            opReturns.push(Object.assign(Object.assign({}, opReturnData), { blockHash: block.hash, txHash: tx.txid, height: block.height }));
        }
    }
    return opReturns;
};
const parseOPRETURNForTx = (tx) => {
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
};
exports.parse = async (logger, network, rpcCredentials) => {
    logger.debug('Initializing RPC Client');
    const RPCClient = initRPCClient(network, rpcCredentials);
    logger.debug('Success');
    const { indexingLimit } = networkConfig[network];
    const limitBlockHash = await RPCClient.getBlockHash(indexingLimit);
    let currentBlockHash = await RPCClient.getBestBlockHash(); // Load from ZeroMQ
    logger.debug({ startingHash: currentBlockHash }, 'Begin parsing');
    while (currentBlockHash !== limitBlockHash) {
        const block = await RPCClient.getBlock(currentBlockHash, 2);
        const opReturns = parseOPRETURNForBlock(block);
        logger.trace({ opReturns: opReturns.map(op => op.data) }, 'OPReturns ready to be saved');
        try {
            await models_1.OPRETURN.bulkCreate(opReturns); // 1 database tx required for all possible OP_RETURNS within a block
            logger.debug({ blockHash: currentBlockHash }, 'Parsing block');
        }
        catch (error) {
            if (!(error instanceof sequelize_1.UniqueConstraintError)) {
                throw error;
            }
            logger.debug({ blockHash: currentBlockHash }, 'Block has already been parsed. Skipping...');
        }
        currentBlockHash = block.previousblockhash;
    }
    logger.debug({ lastHash: currentBlockHash }, 'Parsing completed');
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiT1BSRVRVUk5QYXJzZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvT1BSRVRVUk5QYXJzZXIvT1BSRVRVUk5QYXJzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxnRUFBNkM7QUFDN0MsaURBQWlEO0FBRWpELHlDQUFrRDtBQUNsRCx5Q0FBeUQ7QUFDekQsc0VBQXlDO0FBRXpDLE1BQU0sYUFBYSxHQUFHO0lBQ3BCLE9BQU8sRUFBRTtRQUNQLGFBQWEsRUFBRSxPQUFPO0tBQ3ZCO0lBQ0QsT0FBTyxFQUFFO1FBQ1AsYUFBYSxFQUFFLE1BQU07S0FDdEI7Q0FDRixDQUFDO0FBaUJGLE1BQU0sYUFBYSxHQUFHLENBQUMsT0FBd0IsRUFBRSxXQUEyQixFQUFzQixFQUFFO0lBQ2xHLE9BQU8sSUFBSSxzQkFBaUIsaUNBQ3ZCLFdBQVcsS0FDZCxPQUFPLElBQ1AsQ0FBQztBQUNMLENBQUMsQ0FBQztBQUVGLE1BQU0scUJBQXFCLEdBQUcsQ0FBQyxLQUFVLEVBQWtCLEVBQUU7SUFDM0QsTUFBTSxTQUFTLEdBQW9CLEVBQUUsQ0FBQztJQUV0QyxLQUFLLE1BQU0sRUFBRSxJQUFJLEtBQUssQ0FBQyxFQUFFLEVBQUU7UUFDekIsTUFBTSxnQkFBZ0IsR0FBRyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUVoRCxLQUFLLE1BQU0sWUFBWSxJQUFJLGdCQUFnQixFQUFFO1lBQzNDLFNBQVMsQ0FBQyxJQUFJLGlDQUNULFlBQVksS0FDZixTQUFTLEVBQUUsS0FBSyxDQUFDLElBQUksRUFDckIsTUFBTSxFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQ2YsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLElBQ3BCLENBQUM7U0FDSjtLQUNGO0lBRUQsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQyxDQUFDO0FBRUYsTUFBTSxrQkFBa0IsR0FBRyxDQUFDLEVBQU8sRUFBUyxFQUFFO0lBQzVDLE1BQU0sU0FBUyxHQUFHLEVBQUUs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