//import bunyan from 'bunyan';
//import { network, OPRETURNParser } from './OPRETURNParser';

// let parser: OPRETURNParser;
//
// process.on('message', async (message) => {
//
//   if (message === "init") {
//     const logger = bunyan.createLogger({
//       name: "OPRETURNParser",
//       stream: process.stdout,
//       level: 'info'
//     });
//
//     parser = new OPRETURNParser(logger, {
//       database: {
//         user: process.env.DB_USER,
//         name: process.env.DB_NAME,
//         password: process.env.DB_PASSWORD
//       },
//       rpc: {
//         username: process.env.RPC_USERNAME,
//         password: process.env.RPC_PASSWORD,
//         network: process.env.NETWORK as network
//       }
//     });
//     await parser.initialize();
//     process.send("initialized");
//   }
//
//   if (message === "run") {
//     parser.run();
//     process.send("started");
//   }
//
//   if (message === "stop") {
//     await parser.stop();
//     process.send("stopped");
//   }
//
// });


export { OPReturnParserOptions, OPRETURNParser, network } from './OPRETURNParser';

