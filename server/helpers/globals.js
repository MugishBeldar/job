const moment = require('moment');
require('events').EventEmitter.defaultMaxListeners = 0;
//Getting environment
let ENVIRONMENT = process.env.NODE_ENV;
if (ENVIRONMENT === '' || ENVIRONMENT === undefined) {
  // ENVIRONMENT = 'staging';
  ENVIRONMENT = 'development';
}
global.ENVIRONMENT = ENVIRONMENT;
let environment = ENVIRONMENT;
if (environment.indexOf('/') !== -1) {
  environment = environment.split('/')[1];
}
global.CONFIG = require('../config/environments/' + environment + '.js');
global.config = require('../config/environments/' + environment + '.js');
global.DS = '/';
global.EmailManager = require("./email-manager");
global.bypassedLinks = [];
global.ROOT_PATH = __dirname + '/..';

global.util = require('util');
global.Utils = require('../system/libraries/utils.js');
global.Sequelize = require('sequelize');
global.Q = require('q');
global.Validator = require('validator');
global.Moment = require('moment-timezone');
global.__lodash = require('lodash');
global.constant = require('../constant');

global.time = function () {
  return Math.round(global.Moment.utc().valueOf() / 1000, 0);
};
global.timeout = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
global.currantTime = function () {
  return moment.tz('America/New_York').format('YYYY-MM-DD HH:mm:ss');
};
global.EXCEPTIONS = require('../config/exceptions.json');
const Exception = new require('../system/libraries/exception-new.js');
global.Exception = Exception;
require('../system/libraries/cache.js');
require('./validations.js');

// let userAgent = require('express-useragent');
// global.userAgent = userAgent;

// let FM = require('./filemanager.js');
// global.FileManager = new FM(global.CONFIG);

// let ES = require('./elasticsearch.js');
// global.ElasticSearch = new ES(global.CONFIG);

require('http').globalAgent.maxSockets = Infinity;
require('https').globalAgent.maxSockets = Infinity;

// var slack = require('./slack.js');
// global.slackHelper = new slack(global.CONFIG);

// global.redisClient={};
