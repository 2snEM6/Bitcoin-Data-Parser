import assert from 'assert';
import bunyan, { LogLevel } from 'bunyan';
import { network, OPRETURNParser } from "./OPRETURNParser";

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

  const parserLogger = applicationLogger.child({
    scope: "PARSER"
  });

  applicationLogger.info('Application started');

  const parser = new OPRETURNParser(parserLogger, {
    database: {
      user: process.env.DB_USER,
      name: process.env.DB_NAME,
      password: process.env.DB_PASSWORD
    },
    rpc: {
      username: process.env.RPC_USERNAME,
      password: process.env.RPC_PASSWORD,
      network: process.env.NETWORK as network
    }
  });

  await parser.initialize();

  process.on('SIGINT', async () => {
    applicationLogger.info('Cleaning up and exiting the application...');
    applicationLogger.debug("Caught interrupt signal");

    await parser.stop();
    process.exit();
  });

  applicationLogger.info(`Parsing OP_RETURN data from the Bitcoin ${process.env.NETWORK.toUpperCase()}`);

  parser.run();
};

run();
