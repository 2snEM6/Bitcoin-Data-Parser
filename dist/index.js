"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const bunyan_1 = __importDefault(require("bunyan"));
const OPRETURNParser_1 = require("./OPRETURNParser");
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
    const parserLogger = applicationLogger.child({
        scope: "PARSER"
    });
    applicationLogger.info('Application started');
    const parser = new OPRETURNParser_1.OPRETURNParser(parserLogger, {
        database: {
            user: process.env.DB_USER,
            name: process.env.DB_NAME,
            password: process.env.DB_PASSWORD
        },
        rpc: {
            username: process.env.RPC_USERNAME,
            password: process.env.RPC_PASSWORD,
            network: process.env.NETWORK
        }
    });
    await parser.initialize();
    process.on('SIGINT', async () => {
        applicationLogger.info('Cleaning up and exiting the application...');
        applicationLogger.debug("Caught interrupt signal");
        await parser.stop();
        process.exit();
    });
    applicationLogger.info('Parsing OP_RETURN data from the Bitcoin blockchain');
    parser.run();
    setTimeout(() => {
        parser.stop();
    }, 10000);
};
run();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxvREFBNEI7QUFDNUIsb0RBQTBDO0FBQzFDLHFEQUEyRDtBQUUzRCxNQUFNLEdBQUcsR0FBRyxLQUFLLElBQUksRUFBRTtJQUNyQixNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsSUFBSSxPQUFPLENBQUM7SUFDdEQsZ0JBQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzVCLGdCQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM1QixnQkFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDaEMsZ0JBQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRTVCLE1BQU0saUJBQWlCLEdBQUcsZ0JBQU0sQ0FBQyxZQUFZLENBQUM7UUFDNUMsS0FBSyxFQUFFLGFBQWE7UUFDcEIsSUFBSSxFQUFFLGdCQUFnQjtRQUN0QixNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU07UUFDdEIsS0FBSyxFQUFFLFlBQXdCO0tBQ2hDLENBQUMsQ0FBQztJQUVILE1BQU0sWUFBWSxHQUFHLGlCQUFpQixDQUFDLEtBQUssQ0FBQztRQUMzQyxLQUFLLEVBQUUsUUFBUTtLQUNoQixDQUFDLENBQUM7SUFFSCxpQkFBaUIsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQztJQUU5QyxNQUFNLE1BQU0sR0FBRyxJQUFJLCtCQUFjLENBQUMsWUFBWSxFQUFFO1FBQzlDLFFBQVEsRUFBRTtZQUNSLElBQUksRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU87WUFDekIsSUFBSSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTztZQUN6QixRQUFRLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXO1NBQ2xDO1FBQ0QsR0FBRyxFQUFFO1lBQ0gsUUFBUSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWTtZQUNsQyxRQUFRLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZO1lBQ2xDLE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQWtCO1NBQ3hDO0tBQ0YsQ0FBQyxDQUFDO0lBRUgsTUFBTSxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUM7SUFFMUIsT0FBTyxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxJQUFJLEVBQUU7UUFDOUIsaUJBQWlCLENBQUMsSUFBSSxDQUFDLDRDQUE0QyxDQUFDLENBQUM7UUFDckUsaUJBQWlCLENBQUMsS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFFbkQsTUFBTSxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDcEIsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ2pCLENBQUMsQ0FBQyxDQUFDO0lBRUgsaUJBQWlCLENBQUMsSUFBSSxDQUFDLG9EQUFvRCxDQUFDLENBQUM7SUFFN0UsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBRWIsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUNkLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNoQixDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDWixDQUFDLENBQUM7QUFFRixHQUFHLEVBQUUsQ0FBQyJ9