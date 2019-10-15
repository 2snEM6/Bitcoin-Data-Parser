import assert from 'assert';
import bunyan, { LogLevel } from 'bunyan';
import * as cp from 'child_process';

const run = async () => {
  const loggingLevel = process.env.LOG_LEVEL || 'debug';
  assert(process.env.DB_NAME);
  assert(process.env.DB_USER);
  assert(process.env.DB_PASSWORD);
  assert(process.env.NETWORK);

  const applicationLogger = bunyan.createLogger({
    name: 'APPLICATION',
    stream: process.stdout,
    level: loggingLevel as LogLevel
  });

  applicationLogger.info('Application started');

  const OPRETURNProcess = cp.fork('dist/OPRETURNParser/', [], { silent: true });

  OPRETURNProcess.stdout.pipe(process.stdout);

  process.on('SIGINT', async () => {
    applicationLogger.info('Cleaning up and exiting the application...');
    applicationLogger.debug('Caught interrupt signal');

    process.exit();
  });
};

run();
