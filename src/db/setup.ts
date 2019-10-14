import * as fs from "fs";
import { DataTypes, Sequelize } from 'sequelize';
import { promisify } from 'util';
import { OPRETURN } from './models';

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);


const executeMigrations = async (sequelize: Sequelize) => {
  const fileList = await readdir('../migrations');

  for (const fileName of fileList) {
    console.log(`Executing migration: ${fileName}`);
    const filePath = `../migrations/${fileName}`;
    const fileContentBuffer = await readFile(filePath);
    const query = fileContentBuffer.toString('utf8');
    await sequelize.query(query);
    console.log('Done');
  }
};

export async function initialize(): Promise<Sequelize> {

  const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: 'postgres',
    logging: false,
  });

  await executeMigrations(sequelize);

  OPRETURN.init({
    data: {
      type: new DataTypes.STRING(),
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

  await OPRETURN.sync();
  return sequelize;
}
