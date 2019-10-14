import * as Logger from 'bunyan';
import * as fs from "fs";
import { DataTypes, Sequelize } from 'sequelize';
import { promisify } from 'util';
import { OPRETURN } from './models';

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);

interface DBCredentials {
  readonly dbName: string;
  readonly dbUser: string;
  readonly dbPassword: string;
}

const executeMigrations = async (sequelize: Sequelize) => {
  const migrationsPath = './src/db/migrations/';
  const fileList = await readdir(migrationsPath);

  for (const fileName of fileList) {
    const filePath = `${migrationsPath}${fileName}`;
    const fileContentBuffer = await readFile(filePath);
    const query = fileContentBuffer.toString('utf8');
    await sequelize.query(query);
  }
};


export async function initialize(logger: Logger, credentials: DBCredentials): Promise<Sequelize> {
  logger.debug('Initializing Sequelize');

  const sequelize = new Sequelize(credentials.dbName, credentials.dbUser, credentials.dbPassword, {
    dialect: 'postgres',
    logging: false,
  });

  logger.debug('Success');
  logger.debug('Executing migrations');

  await executeMigrations(sequelize);

  logger.debug('Success');
  logger.debug('Initializing models');

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
    sequelize
  });

  logger.debug('Success');
  logger.debug('Syncing database');

  await OPRETURN.sync();

  logger.debug('Success');
  logger.debug('Successfully initialized Sequelize');

  return sequelize;
}
