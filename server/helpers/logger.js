console.log = function () {
};
console.error = function () {
};
module.exports = function (module) {
  const winston = require('winston');
  const Console = winston.transports.Console;
  let logging_option = global.CONFIG.logging;
  let transports = [];
  for (let type in logging_option) {
    if (logging_option[type].enabled) {
      if (type == 'console') {
        transports.push(new Console(logging_option[type]));
      }
    }
  }
  let logger = new winston.createLogger({
    exitOnError: false,
    transports: transports
  });

  console.log = function (target) {
    logger.debug(arguments);
  };
  console.info = function (target) {
    logger.info(arguments);
  };

  console.error = function (target) {
    logger.error(arguments);
  };

  console.warn = function (target) {
    logger.warn(arguments);
  };
  return logger;
};
