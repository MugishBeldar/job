const http = require('http');
const bfj = require('bfj');
const RapidRouter = require('./rapid-router');
const cluster = require('cluster');
const moment = require('moment');
const uuid = require('uuid');
const Logger = require('./logger');
const parseUrlEncodedBody = require('co-body');
const multiparty = require('multiparty');
//const formBody = new multiparty.Form();
const fs = require('fs');

class RapidHttpServer {
  constructor(Application, isPublic) {
    this.Application = Application;
    this.isPublicServer = isPublic;
    this.logger = Logger(Application.getAppName());
    global.logger = this.logger;
  }

  startServer(noOfWorkersToStart) {
    if (cluster.isMaster) {
      console.info(`Master ${process.pid} is running`);
      console.info('global.ENVIRONMENT', global.ENVIRONMENT);
      // Fork workers.
      for (let i = 0; i < noOfWorkersToStart; i++) {
        cluster.fork(process.env);
      }
      cluster.on('exit', worker => {
        console.info(`worker ${worker.process.pid} died`);
        cluster.fork(process.env);
      });
    } else {
      this.initWorker();
    }
    // this.initWorker();
  }

  async initWorker() {
    const router = new RapidRouter();
    const app = new this.Application(router, this.logger);
    await app.start(this.isPublicServer);
    const server = http
      .createServer(async (request, response) => {
        request.logger = this.logger;
        request.startTime = moment()
          .utc()
          .valueOf();
        request.stats = {};
        request.uuid = uuid.v4();
        request
          .on('error', (err) => {
            console.error(err.stack);
          })
          .on('aborted', (err) => {
            console.error(`Aborted by client --> ${request.url}`, err);
          });
        response.on('error', (err) => {
          console.error('Error sending response', err);
        });
        console.info('request.url ---> ', request.url);
        if (request.method === 'GET' || request.method === 'HEAD') {
          await router.handleRequest(request, response);
        } else if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
          if (request.headers['content-type'] == 'application/json') {
            bfj.parse(request).then(async data => {
              request.body = data;
              router.handleRequest(request, response);
            }).catch(error => {
              request.logger.error('Error:', error);
              response.writeHead(400, {'content-type': 'application/json'});
              response.end({msg: 'invalid json received'});
            });
          } else if (request.headers['content-type'] == 'application/x-www-form-urlencoded') {
            try {
              request.body = await parseUrlEncodedBody.form(request);
              router.handleRequest(request, response);
            } catch (e) {
              request.logger.error(e);
              response.writeHead(400, {'content-type': 'application/json'});
              response.end({msg: 'invalid body received'});
            }
          } else if (request.headers['content-type'].indexOf('multipart/form-data') == 0) {
            var form = new multiparty.Form();
            form.parse(request, (err, fields, files) => {
              if (err) {
                request.logger.error(err);
                response.writeHead(400, {'content-type': 'application/json'});
                response.end({msg: 'invalid body received'});
              } else {
                request.body = fields;
                request.files = files;
                router.handleRequest(request, response);
              }
            });
          } else {
            response.writeHead(400, {
              'content-type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
            });
            response.end(JSON.stringify({
              Status: 'failure',
              Error: {message: 'content-type ' + request.headers['content-type'] + ' supported'}
            }));
          }
        } else {
          response.writeHead(405);
          response.end();
        }

      })
      .listen(this.isPublicServer ?  global.config.server.publicPort : (process.env.NODE_PORT || global.config.server.port))
      .on('clientError', (err, socket) => {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      }).on('error', (err) => {
        console.error(err);
      });
    process.on('SIGINT', () => {
      server.close((err) => {
        if (err) {
          global.logger.error('Error-closing-server', err);
          process.exit(1)
        }
      })
    });
    console.info(`Worker ${process.pid} started`);
    console.info(`Server is Running on Port No. ${this.isPublicServer ?  global.config.server.publicPort : (process.env.NODE_PORT || global.config.server.port)}`);
  }
}

module.exports = RapidHttpServer;
