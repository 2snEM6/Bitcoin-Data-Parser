import bunyan, { LogLevel } from 'bunyan';
import express from 'express';
import { opreturnRouter } from './routers';

const logger = bunyan.createLogger({
	name: 'WEB_SERVER',
	stream: process.stdout,
	level: (process.env.LOG_LEVEL as LogLevel) || 'debug',
});

const app = express();
const port = process.env.WEB_SERVER_PORT || 8080;

app.use('/', opreturnRouter);

app.listen(port, () => {
	logger.info(`Web server started listening at http://localhost:${port}`);
});
