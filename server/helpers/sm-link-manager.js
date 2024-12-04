const App = require('../app');

class SMLinkManager {
  constructor() {

  }

  async linkHandler(req) {
    let hostname = req.hostname;

    if (req.headers['x-linkname']) {
      hostname = req.headers['x-linkname'];
    }
    req.linkName = hostname;
    req.getMasterNodeConnection = async () => {
      try {
        const connection = await global.masterConnectionPool.getConnection();
        await connection.changeUser({
          database: global.CONFIG.mysql.name
        });
        return connection;
      } catch (e) {
        throw e;
        //TODO: Handle error and send notification to support and dev team
      }
    };

    req.getProxyNodeConnection = async () => {
      try {
        const connection = await global.proxyConnectionPool.getConnection();
        await connection.changeUser({
          database: global.CONFIG.mysql.name
        });
        return connection;
      } catch (e) {
        throw e;
        //TODO: Handle error and send notification to support and dev team
      }
    };
  }
}

module.exports = function () {
  const linkManager = new SMLinkManager();
  return async function linkManagerMiddleWare(req, res, next) {
    try {
      req.stats['m4-link-manager'] = time();
      await linkManager.linkHandler(req);
      if (next) {
        next();
      } else {
        return true;
      }
    } catch (e) {
      res.sendError(e);
      return false;
    }
  }
}();
