import { Model } from 'sequelize';
export declare class OPRETURN extends Model {
    data: number;
    utxoIdx: number;
    blockHash: string;
    txHash: string;
    height: string;
}
