require('./helpers/globals');
global.Exception = require('./system/libraries/exception-new');
global.ROOT_PATH = __dirname;
global.sendEmailToUser = true;
const APIServer=require('./api-server');
const RapidHttpServer=require('./helpers/rapid-http-server');
new RapidHttpServer(APIServer).startServer(process.env.NO_PROCESSES || 1);

