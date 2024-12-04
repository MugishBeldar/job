const App = require('./app');
const fs = require('fs');

class APIServer {
  constructor(router, logger) {
    this.router = router;
    this.logger = logger;
  }

  static getAppName() {
    return 'Division Sync';
  }

  async start(isPublic) {
    App.initModels();
    await App.initMigrations();
    App.setupMasterNodeDBConnectionPool();
    App.setupProxyNodeDBConnectionPool();
    // App.setupCache();
    this.initBasePaths();
    await App.setupLinkManager(this.router);
    await App.setupAuthManager(this.router, isPublic);
    this.setupControllers();



    this.router.get('/test', (req, res) => {
      console.info(req);
      console.info('req.connection ',req.connection);
      res.sendResponse(req.query);
    });
    return true;
  }

  initBasePaths() {
    this.router.get('/', async function (req, res) {
      res.send('Welcome to Division Sync API Server......');
    });
    this.router.get('/health-check', async function (req, res) {
      res.send('');
    });
  }


  setupControllers() {
    fs.readdirSync(global.ROOT_PATH + '/controllers').filter((file) => {
      let stats = fs.statSync(global.ROOT_PATH + '/controllers/' + file);
      return (file.indexOf('.controller.js') !== -1 && !stats.isDirectory());
    }).forEach((file) => {
      const Controller = require('./controllers/' + file);
      new Controller(this.router);
    });
  }
}

module.exports = APIServer;
