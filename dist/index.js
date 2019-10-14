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
const assert_1 = __importDefault(require("assert"));
const bunyan_1 = __importDefault(require("bunyan"));
const DB = __importStar(require("./db"));
const OPRETURNParser = __importStar(require("./OPRETURNParser"));
const run = async () => {
    const loggingLevel = process.env.LOG_LEVEL || 'trace';
    assert_1.default(process.env.DB_NAME);
    assert_1.default(process.env.DB_USER);
    assert_1.default(process.env.DB_PASSWORD);
    assert_1.default(process.env.NETWORK);
    const applicationLogger = bunyan_1.default.createLogger({
        scope: "APPLICATION",
        name: "OPRETURNParser",
        stream: process.stdout,
        level: loggingLevel
    });
    const dbLogger = applicationLogger.child({
        scope: "DB"
    });
    const parserLogger = applicationLogger.child({
        scope: "PARSER"
    });
    applicationLogger.info('Application started');
    applicationLogger.info('Initializing database');
    const database = await DB.initialize(dbLogger, {
        dbName: process.env.DB_NAME,
        dbUser: process.env.DB_USER,
        dbPassword: process.env.DB_PASSWORD
    }); // Setups DB schema
    applicationLogger.info('Database initialized');
    process.on('SIGINT', async () => {
        applicationLogger.info('Cleaning up and exiting the application...');
        applicationLogger.debug("Caught interrupt signal");
        await database.close();
        process.exit();
    });
    applicationLogger.info('Parsing OP_RETURN data from the Bitcoin blockchain');
    await OPRETURNParser.parse(parserLogger, process.env.NETWORK, {
        username: process.env.RPC_USERNAME,
        password: process.env.RPC_PASSWORD,
    });
    applicationLogger.info('Blockchain sucessfully parsed');
    applicationLogger.info('Application finished successfully');
};
run();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsb0RBQTRCO0FBQzVCLG9EQUEwQztBQUMxQyx5Q0FBMkI7QUFDM0IsaUVBQW1EO0FBR25ELE1BQU0sR0FBRyxHQUFHLEtBQUssSUFBSSxFQUFFO0lBRXJCLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxJQUFJLE9BQU8sQ0FBQztJQUN0RCxnQkFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDNUIsZ0JBQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzVCLGdCQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNoQyxnQkFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFNUIsTUFBTSxpQkFBaUIsR0FBRyxnQkFBTSxDQUFDLFlBQVksQ0FBQztRQUM1QyxLQUFLLEVBQUUsYUFBYTtRQUNwQixJQUFJLEVBQUUsZ0JBQWdCO1FBQ3RCLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTTtRQUN0QixLQUFLLEVBQUUsWUFBd0I7S0FDaEMsQ0FBQyxDQUFDO0lBQ0gsTUFBTSxRQUFRLEdBQUcsaUJBQWlCLENBQUMsS0FBSyxDQUFDO1FBQ3ZDLEtBQUssRUFBRSxJQUFJO0tBQ1osQ0FBQyxDQUFDO0lBQ0gsTUFBTSxZQUFZLEdBQUcsaUJBQWlCLENBQUMsS0FBSyxDQUFDO1FBQzNDLEtBQUssRUFBRSxRQUFRO0tBQ2hCLENBQUMsQ0FBQztJQUVILGlCQUFpQixDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0lBQzlDLGlCQUFpQixDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0lBRWhELE1BQU0sUUFBUSxHQUFHLE1BQU0sRUFBRSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUU7UUFDN0MsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTztRQUMzQixNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPO1FBQzNCLFVBQVUsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVc7S0FDcEMsQ0FBQyxDQUFDLENBQUMsbUJBQW1CO0lBRXZCLGlCQUFpQixDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0lBRS9DLE9BQU8sQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQzlCLGlCQUFpQixDQUFDLElBQUksQ0FBQyw0Q0FBNEMsQ0FBQyxDQUFDO1FBQ3JFLGlCQUFpQixDQUFDLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBRW5ELE1BQU0sUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3ZCLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNqQixDQUFDLENBQUMsQ0FBQztJQUVILGlCQUFpQixDQUFDLElBQUksQ0FBQyxvREFBb0QsQ0FBQyxDQUFDO0lBRTdFLE1BQU0sY0FBYyxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUEwQixFQUFFO1FBQy9FLFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVk7UUFDbEMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWTtLQUNuQyxDQUFDLENBQUM7SUFFSCxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsK0JBQStCLENBQUMsQ0FBQztJQUN4RCxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsbUNBQW1DLENBQUMsQ0FBQztBQUM5RCxDQUFDLENBQUM7QUFFRixHQUFHLEVBQUUsQ0FBQyJ9