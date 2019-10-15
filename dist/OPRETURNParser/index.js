"use strict";
//import bunyan from 'bunyan';
//import { network, OPRETURNParser } from './OPRETURNParser';
Object.defineProperty(exports, "__esModule", { value: true });
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
var OPRETURNParser_1 = require("./OPRETURNParser");
exports.OPRETURNParser = OPRETURNParser_1.OPRETURNParser;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvT1BSRVRVUk5QYXJzZXIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDhCQUE4QjtBQUM5Qiw2REFBNkQ7O0FBRTdELDhCQUE4QjtBQUM5QixFQUFFO0FBQ0YsNkNBQTZDO0FBQzdDLEVBQUU7QUFDRiw4QkFBOEI7QUFDOUIsMkNBQTJDO0FBQzNDLGdDQUFnQztBQUNoQyxnQ0FBZ0M7QUFDaEMsc0JBQXNCO0FBQ3RCLFVBQVU7QUFDVixFQUFFO0FBQ0YsNENBQTRDO0FBQzVDLG9CQUFvQjtBQUNwQixxQ0FBcUM7QUFDckMscUNBQXFDO0FBQ3JDLDRDQUE0QztBQUM1QyxXQUFXO0FBQ1gsZUFBZTtBQUNmLDhDQUE4QztBQUM5Qyw4Q0FBOEM7QUFDOUMsa0RBQWtEO0FBQ2xELFVBQVU7QUFDVixVQUFVO0FBQ1YsaUNBQWlDO0FBQ2pDLG1DQUFtQztBQUNuQyxNQUFNO0FBQ04sRUFBRTtBQUNGLDZCQUE2QjtBQUM3QixvQkFBb0I7QUFDcEIsK0JBQStCO0FBQy9CLE1BQU07QUFDTixFQUFFO0FBQ0YsOEJBQThCO0FBQzlCLDJCQUEyQjtBQUMzQiwrQkFBK0I7QUFDL0IsTUFBTTtBQUNOLEVBQUU7QUFDRixNQUFNO0FBR04sbURBQWtGO0FBQWxELDBDQUFBLGNBQWMsQ0FBQSJ9