import * as Logger from 'bunyan';
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
export declare type network = 'testnet' | 'mainnet';
export declare class OPRETURNParser {
    private readonly database;
    private readonly logger;
    private readonly rpc;
    private readonly network;
    private enabled;
    constructor(logger: Logger, options: OPReturnParserOptions);
    initialize(): Promise<void>;
    stop(): Promise<void>;
    run(): Promise<void>;
    private executeMigrations;
    private initializeDatabaseClient;
    private initializeRPCClient;
    private parseOPRETURNForTx;
    private parseOPRETURNForBlock;
}
