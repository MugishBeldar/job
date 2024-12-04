require('./helpers/globals');
let Logger = require('./helpers/logger');
let request = require('./system/libraries/request');
const mysql = require('mysql2');
const fs = require('fs');
let path = require('path');
let _ = require('lodash');
const Sequelize = require("sequelize");
const Umzug = require("umzug");
const linkHandler = require('./helpers/sm-link-manager');
const authHandler = require('./helpers/sm-auth-manager');

class App {
  constructor(loggerName) {
    this.logger = Logger(loggerName);
  }


  static initModels() {
    global.models = {};
    fs.readdirSync(global.ROOT_PATH + '/models').filter((file) => {
      let stats = fs.statSync(global.ROOT_PATH + '/models/' + file);
      return (!stats.isDirectory());
    }).forEach((file) => {
      const model = require('./models/' + file);
      global.models[model.name] = model;
    });
  }

  static async initMigrations() {
    for (let i = 0; i < global.CONFIG.dbConfig.length; i++) {
      let sequelize = new Sequelize(global.CONFIG.dbConfig[i].dbName, global.CONFIG.mysql.username, global.CONFIG.mysql.password, {
        dialect: 'mysql',
        port: global.CONFIG.mysql.port,
        host: global.CONFIG.mysql.host,
        operatorsAliases: global.CONFIG.mysql.operatorsAliases,
        pool: {
          max: 10,
          min: 0,
          idle: 1000,
        },
        dialectOptions: {
          multipleStatements: true,
        },
        omitNull: false,
        logging: global.CONFIG.mysql.debug ? console.log : false,
      });
      global.sequelize = sequelize;
      try {
        await sequelize.authenticate();

        //Copy migration from all modules to tmp_migrations dir
        let tmpMigrationPath = path.join(__dirname, '.tmp_migrations');
        if (fs.existsSync(tmpMigrationPath)) {
          //Remove tmp_migrations folder
          this.removeDir(tmpMigrationPath);
        }
        fs.mkdirSync(tmpMigrationPath, { mode: 0o777 });

        let migrationPath = path.join(__dirname, global.CONFIG.dbConfig[i].migrationPath);
        if (fs.existsSync(migrationPath)) {
          fs.readdirSync(migrationPath).forEach((file) => {
            if (file.indexOf('.') !== 0) {
              fs.writeFileSync(path.join(tmpMigrationPath, file),
                fs.readFileSync(path.join(migrationPath, file)), { mode: 0o777 });
            }
          });
        }

        //Run Migration on tmp_migrations folder
        let umzug = new Umzug({
          storage: 'sequelize',
          storageOptions: {
            sequelize: sequelize,
          },
          migrations: {
            params: [
              sequelize.getQueryInterface(), sequelize.constructor, function () {
                throw new Error(
                  'Migration tried to use old style "done" callback. Please upgrade to "umzug" and return a promise instead.');
              }],
            path: tmpMigrationPath,
            pattern: /\.js$/,
          },
        });

        await umzug.up();
        //Remove tmp_migrations folder
        this.removeDir(tmpMigrationPath)
      } catch (err) {
        console.log('Error in Running Database Migration : ', err);
        throw new Error(err);
      }
    }
    return true;
  }

  static removeDir(dirPath) {
    fs.readdirSync(dirPath).forEach((file) => {
      if (file.indexOf('.') !== 0) {
        fs.unlinkSync(path.join(dirPath, file));
      }
    });
    fs.rmdirSync(dirPath);
  }

  static setupMasterNodeDBConnectionPool() {
    // create the pool
    const pool = mysql.createPool({
      host: global.CONFIG.mysql.hostForReadWrite,
      port: global.CONFIG.mysql.portForReadWrite,
      user: global.CONFIG.mysql.username,
      password: global.CONFIG.mysql.password,
      waitForConnections: true,
      connectionLimit: global.CONFIG.mysql.poolSize
    });
    const promisePool = pool.promise();
    global.masterConnectionPool = promisePool;
  }

  static setupProxyNodeDBConnectionPool() {
    // create the pool
    const pool = mysql.createPool({
      host: global.CONFIG.mysql.host,
      port: global.CONFIG.mysql.port,
      user: global.CONFIG.mysql.username,
      password: global.CONFIG.mysql.password,
      waitForConnections: true,
      connectionLimit: global.CONFIG.mysql.poolSize
    });
    const promisePool = pool.promise();
    global.proxyConnectionPool = promisePool;
  }

  // static setupCache() {
  //   //Initializing Memcached Server
  //   var cache = new Cache(global.CONFIG.caching);
  //   global.cache = cache;
  // }

  static setupLinkManager(router) {
    router.use(linkHandler);
  }

  static setupAuthManager(router, isPublic) {
    let completelyByPassedPaths = [
    ];
    let publicPaths = [

    ];
    router.use(authHandler(publicPaths, ['/api/v1/login', '/api/v1/logout'], completelyByPassedPaths, []));

  }

}

module.exports = App;
