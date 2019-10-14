"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const sequelize_1 = require("sequelize");
const util_1 = require("util");
const models_1 = require("./models");
const readFile = util_1.promisify(fs.readFile);
const readdir = util_1.promisify(fs.readdir);
const executeMigrations = async (sequelize) => {
    const migrationsPath = './src/db/migrations/';
    const fileList = await readdir(migrationsPath);
    for (const fileName of fileList) {
        const filePath = `${migrationsPath}${fileName}`;
        const fileContentBuffer = await readFile(filePath);
        const query = fileContentBuffer.toString('utf8');
        await sequelize.query(query);
    }
};
async function initialize(logger, credentials) {
    logger.debug('Initializing Sequelize');
    const sequelize = new sequelize_1.Sequelize(credentials.dbName, credentials.dbUser, credentials.dbPassword, {
        dialect: 'postgres',
        logging: false,
    });
    logger.debug('Success');
    logger.debug('Executing migrations');
    await executeMigrations(sequelize);
    logger.debug('Success');
    logger.debug('Initializing models');
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
        sequelize
    });
    logger.debug('Success');
    logger.debug('Syncing database');
    await models_1.OPRETURN.sync();
    logger.debug('Success');
    logger.debug('Successfully initialized Sequelize');
    return sequelize;
}
exports.initialize = initialize;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZGIvc2V0dXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQ0EsdUNBQXlCO0FBQ3pCLHlDQUFpRDtBQUNqRCwrQkFBaUM7QUFDakMscUNBQW9DO0FBRXBDLE1BQU0sUUFBUSxHQUFHLGdCQUFTLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3hDLE1BQU0sT0FBTyxHQUFHLGdCQUFTLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBUXRDLE1BQU0saUJBQWlCLEdBQUcsS0FBSyxFQUFFLFNBQW9CLEVBQUUsRUFBRTtJQUN2RCxNQUFNLGNBQWMsR0FBRyxzQkFBc0IsQ0FBQztJQUM5QyxNQUFNLFFBQVEsR0FBRyxNQUFNLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUUvQyxLQUFLLE1BQU0sUUFBUSxJQUFJLFFBQVEsRUFBRTtRQUMvQixNQUFNLFFBQVEsR0FBRyxHQUFHLGNBQWMsR0FBRyxRQUFRLEVBQUUsQ0FBQztRQUNoRCxNQUFNLGlCQUFpQixHQUFHLE1BQU0sUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ25ELE1BQU0sS0FBSyxHQUFHLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNqRCxNQUFNLFNBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDOUI7QUFDSCxDQUFDLENBQUM7QUFHSyxLQUFLLFVBQVUsVUFBVSxDQUFDLE1BQWMsRUFBRSxXQUEwQjtJQUN6RSxNQUFNLENBQUMsS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUM7SUFFdkMsTUFBTSxTQUFTLEdBQUcsSUFBSSxxQkFBUyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsVUFBVSxFQUFFO1FBQzlGLE9BQU8sRUFBRSxVQUFVO1FBQ25CLE9BQU8sRUFBRSxLQUFLO0tBQ2YsQ0FBQyxDQUFDO0lBRUgsTUFBTSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN4QixNQUFNLENBQUMsS0FBSyxDQUFDLHNCQUFzQixDQUFDLENBQUM7SUFFckMsTUFBTSxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUVuQyxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3hCLE1BQU0sQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQztJQUVwQyxpQkFBUSxDQUFDLElBQUksQ0FBQztRQUNaLElBQUksRUFBRTtZQUNKLElBQUksRUFBRSxJQUFJLHFCQUFTLENBQUMsSUFBSSxFQUFFO1lBQzFCLFNBQVMsRUFBRSxLQUFLO1NBQ2pCO1FBQ0QsU0FBUyxFQUFFO1lBQ1QsVUFBVSxFQUFFLElBQUk7WUFDaEIsSUFBSSxFQUFFLElBQUkscUJBQVMsQ0FBQyxNQUFNLEVBQUU7WUFDNUIsU0FBUyxFQUFFLEtBQUs7U0FDakI7UUFDRCxNQUFNLEVBQUU7WUFDTixVQUFVLEVBQUUsSUFBSTtZQUNoQixJQUFJLEVBQUUsSUFBSSxxQkFBUyxDQUFDLE1BQU0sRUFBRTtZQUM1QixTQUFTLEVBQUUsS0FBSztTQUNqQjtRQUNELE9BQU8sRUFBRTtZQUNQLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLElBQUksRUFBRSxJQUFJLHFCQUFTLENBQUMsT0FBTyxFQUFFO1lBQzdCLFNBQVMsRUFBRSxLQUFLO1NBQ2pCO1FBQ0QsTUFBTSxFQUFFO1lBQ04sSUFBSSxFQUFFLElBQUkscUJBQVMsQ0FBQyxPQUFPLEVBQUU7WUFDN0IsU0FBUyxFQUFFLEtBQUs7U0FDakI7S0FDRixFQUFFO1FBQ0QsT0FBTyxFQUFFO1lBQ1A7Z0JBQ0UsTUFBTSxFQUFFLENBQUMsTUFBTSxDQUFDO2dCQUNoQixLQUFLLEVBQUUsS0FBSztnQkFDWixRQUFRLEVBQUUsY0FBYzthQUN6QjtTQUNGO1FBQ0QsU0FBUyxFQUFFLFdBQVc7UUFDdEIsU0FBUztLQUNWLENBQUMsQ0FBQztJQUVILE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDeEIsTUFBTSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBRWpDLE1BQU0saUJBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUV0QixNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3hCLE1BQU0sQ0FBQyxLQUFLLENBQUMsb0NBQW9DLENBQUMsQ0FBQztJQUVuRCxPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDO0FBN0RELGdDQTZEQyJ9