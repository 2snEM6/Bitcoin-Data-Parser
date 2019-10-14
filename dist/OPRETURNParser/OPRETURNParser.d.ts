import * as Logger from 'bunyan';
interface RPCCredentials {
    readonly username: string;
    readonly password: string;
}
export declare type BitcoinNetworks = 'testnet' | 'mainnet';
export declare const parse: (logger: Logger, network: BitcoinNetworks, rpcCredentials: RPCCredentials) => Promise<void>;
export {};
