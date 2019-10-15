/* tslint:disable:no-class readonly-keyword */
// tslint:disable-next-line:no-class
import { Model } from 'sequelize';

export class OPRETURN extends Model {
  public data!: number;
  public utxoIdx!: number;
  public blockHash!: string;
  public txHash!: string;
  public height!: string;
}
