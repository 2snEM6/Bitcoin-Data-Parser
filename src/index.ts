import assert from 'assert';
import bunyan, { LogLevel } from 'bunyan';
import * as DB from "./db";
import * as OPRETURNParser from "./OPRETURNParser";
import { BitcoinNetworks } from './OPRETURNParser/OPRETURNParser';

const run = async () => {

  const loggingLevel = process.env.LOG_LEVEL || 'trace';
  assert(process.env.DB_NAME);
  assert(process.env.DB_USER);
  assert(process.env.DB_PASSWORD);
  assert(process.env.NETWORK);

  const applicationLogger = bunyan.createLogger({
    scope: "APPLICATION",
    name: "OPRETURNParser",
    stream: process.stdout,
    level: loggingLevel as LogLevel
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

  await OPRETURNParser.parse(parserLogger, process.env.NETWORK as BitcoinNetworks, {
    username: process.env.RPC_USERNAME,
    password: process.env.RPC_PASSWORD,
  });

  applicationLogger.info('Blockchain sucessfully parsed');
  applicationLogger.info('Application finished successfully');
};

run();
