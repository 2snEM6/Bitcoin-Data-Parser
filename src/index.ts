import assert from 'assert';
import * as Bunyan from 'bunyan';
import * as cp from 'child_process';

const terminateChildProcesses = (
  logger: Bunyan,
  processes: cp.ChildProcess[]
) => {
  logger.info('Terminating API and Parser...');
  for (const process of processes) {
    logger.debug(`Killing process with PID: ${process.pid}`);
    process.kill();
    logger.debug('Done');
  }
  logger.info('Successfully terminated both services');
};

const run = async () => {
  const loggingLevel = process.env.LOG_LEVEL || 'debug';
  assert(process.env.DB_NAME);
  assert(process.env.DB_USER);
  assert(process.env.DB_PASSWORD);
  assert(process.env.NETWORK);

  const applicationLogger = Bunyan.createLogger({
    name: 'APPLICATION',
    stream: process.stdout,
    level: loggingLevel as Bunyan.LogLevel
  });

  applicationLogger.info('Application started');

  const OPRETURNProcess = cp.fork('dist/OPRETURNParser/', [], { silent: true });
  OPRETURNProcess.stdout.pipe(process.stdout);

  const apiProcess = cp.fork('dist/api/', [], { silent: true });
  apiProcess.stdout.pipe(process.stdout);

  const childProcesses = [apiProcess, OPRETURNProcess];

  process.on('SIGINT', async () => {
    terminateChildProcesses(applicationLogger, childProcesses);
    process.exit();
  });

  process.on('SIGTERM', () => {
    terminateChildProcesses(applicationLogger, childProcesses);
    process.exit();
  });
};

run();
