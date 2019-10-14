import * as Logger from 'bunyan';
import { Sequelize } from 'sequelize';
interface DBCredentials {
    readonly dbName: string;
    readonly dbUser: string;
    readonly dbPassword: string;
}
export declare function initialize(logger: Logger, credentials: DBCredentials): Promise<Sequelize>;
export {};
