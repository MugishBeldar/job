'use strict';
let App = require('../app');

class INIT {
  constructor() {
  }

  static async setupSQLConnections(dbName) {
    App.initModels();
    App.setupMasterNodeDBConnectionPool();
    App.setupProxyNodeDBConnectionPool();
    return {
      getProxyNodeConnection : async () => {
        try {
          const connection = await global.proxyConnectionPool.getConnection();
          await connection.changeUser({
            database: dbName
          });
          return connection;
        } catch (e) {
          throw e;
          //TODO: Handle error and send notification to support and dev team
        }
      },
      getMasterNodeConnection : async () => {
        try {
          const connection = await global.masterConnectionPool.getConnection();
          await connection.changeUser({
            database: dbName
          });
          return connection;
        } catch (e) {
          throw e;
          //TODO: Handle error and send notification to support and dev team
        }
      }
    }
  }

  static async getMsSqlConnection(){
    await App.setupMsSqlConnection();
    return global.mssql;
  }
}

module.exports = INIT;
