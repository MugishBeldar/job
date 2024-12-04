const moment = require('moment');
const UrlPattern = require('url-pattern');
const bfj = require('bfj');
const Exception = require('../system/libraries/exception-new');
const _=require('lodash');
const url = require('url');

class RapidRouter {
  constructor() {
    this.__get = {};
    this.__post = {};
    this.__delete = {};
    this.__put = {};
    this.__middlewares = [];
    this.__corsHeaders = {};
  }

  cors(options) {
    this.__corsHeaders['Access-Control-Allow-Origin'] = '*';
    this.__corsHeaders['Access-Control-Allow-Methods'] = 'GET,HEAD,PUT,PATCH,POST,DELETE';
    this.__corsHeaders['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept';
  }

  use(route, handler) {
    if (typeof route == 'string') {
      this.__middlewares.push({
        route: route,
        urlPatternObj: new UrlPattern(route, {
          'segmentValueCharset': '.@a-zA-Z0-9_-'
        }),
        handler: handler
      });
    } else {
      this.__middlewares.push({
        handler: route
      });
    }
  }

  /**
   * @param route
   * @param methodName
   */
  get(route, methodName) {
    this.__get[route] = {
      methodName: methodName,
      urlPatternObj: new UrlPattern(route, {
        'segmentValueCharset': '.@a-zA-Z0-9_-'
      }),
      middlewares: _.clone(this.__middlewares)
    };
  }

  /**
   * @param route
   * @param methodName
   */
  post(route, methodName) {
    this.__post[route] = {
      methodName: methodName,
      urlPatternObj: new UrlPattern(route, {
        'segmentValueCharset': '.@a-zA-Z0-9_-'
      }),
      middlewares: _.clone(this.__middlewares)
    };
  }

  /**
   * @param route
   * @param methodName
   */
  delete(route, methodName) {
    this.__delete[route] = {
      methodName: methodName,
      urlPatternObj: new UrlPattern(route, {
        'segmentValueCharset': '.@a-zA-Z0-9_-'
      }),
      middlewares: _.clone(this.__middlewares)
    };
  }

  /**
   * @param route
   * @param methodName
   */
  put(route, methodName) {
    this.__put[route] = {
      methodName: methodName,
      urlPatternObj: new UrlPattern(route, {
        'segmentValueCharset': '.@a-zA-Z0-9_-'
      }),
      middlewares: _.clone(this.__middlewares)
    };
  }

  /**
   * @param request
   * @param response
   * @returns {Promise<void>}
   */
  async handleRequest(request, response) {
    request.hostname = request.headers.host;
    request.query = url.parse(request.url, true).query;
    response.__corsHeaders = this.__corsHeaders;
    response.sendResponse = this.response(response, request);
    response.sendError = this.errorResponse(response, request);
    response.send = (body) => {
      response.end(body);
    };
    if (request.method === 'GET') {
      await this.executeRequest(request, response, "__get");
    } else if (request.method === 'POST') {
      await this.executeRequest(request, response, "__post");
    } else if (request.method === 'DELETE') {
      await this.executeRequest(request, response, "__delete");
    } else if (request.method === 'PUT') {
      await this.executeRequest(request, response, "__put");
    }
  }


  async executeRequest(request, response, routeMapKey) {
    const keys = Object.keys(this[routeMapKey]);
    let match = null;
    let matchedRoute = null;
    let matchedRouteName = null;
    let pathname = new URL(request.protocol + '://' + request.hostname + request.url)["pathname"];
    for (let i = 0, n = keys.length; i < n; i++) {
      let urlPatternObj = this[routeMapKey][keys[i]].urlPatternObj;
      match = urlPatternObj.match(pathname);
      if (match) {
        request.params = match;
        matchedRoute = this[routeMapKey][keys[i]];
        matchedRouteName = keys[i];
        request.matchedRouteName = matchedRouteName;
        break;
      }
    }
    if (!match) {
      return response.sendError(new Exception('RouteNotFound'));
    } else {
      if (await this.processMiddleware(matchedRoute, request, response)) {
        await matchedRoute.methodName(request, response);
      }
    }
  }

  /**
   * @param response
   * @param request
   * @returns {sendResponse}
   */
  response(response, request) {
    const self = this;
    return async function sendResponse(payload, httpStatusCode = 200, message) {
      const payLd = {
        Status: 'success',
        Data: payload,
        Message: message
      };
      if (httpStatusCode === true) {
        httpStatusCode = 200;
      }
      const responseTime = moment().utc().valueOf() - request.startTime;
      response.writeHead(httpStatusCode, _.assign({
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
        'X-Response-Time': `${responseTime}ms`,
        'X-Response-Id': `${request.uuid}`
      }, response.__corsHeaders));
      await bfj.streamify(payLd, {Promise: Promise}).pipe(response);
      if (request.originalUrl) {
        // if (request.originalUrl.indexOf('/activities?pageNo') > 0 && responseTime >= 3000) {
        //     request.logger.info(`Timeline Call info: ${request.linkName}, ${request.originalUrl}, ${responseTime}`)
        // } else
        if (responseTime >= 2000 && responseTime <= 3000) {
          request.logger.info(`Slow-Response: ${request.originalUrl}, ${responseTime}`, self.getRequestInfo(request));
        } else if (responseTime > 3000 && responseTime <= 5000) {
          request.logger.info(`Very-Slow-Response: ${request.originalUrl}, ${responseTime}`, self.getRequestInfo(request));
        } else if (responseTime > 5000 && responseTime <= 7000) {
          request.logger.info(`Very-Very-Slow-Response: ${request.originalUrl}, ${responseTime}`, self.getRequestInfo(request));
        } else if (responseTime > 7000) {
          request.logger.info(`Extremely-Slow-Response: ${request.originalUrl}, ${responseTime}`, self.getRequestInfo(request));
        }
      }
    };
  }

  errorResponse(response, request) {
    const self = this;
    return async function sendError(error) {
      let payload;
      if (error instanceof Exception) {
        payload = {
          'Status': 'failure',
          'Error': error.getExceptionMessage()
        };
      } else {
        payload = {
          'Status': 'failure',
          'Error': error
        };
      }

      const responseTime = moment().utc().valueOf() - request.startTime;

      response.writeHead(error.httpStatusCode || 400, _.assign({
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
        'X-Request-Time': `${responseTime}ms`,
        'X-Response-Id': `${request.uuid}`
      }, response.__corsHeaders));

      await bfj.streamify(payload, {Promise: Promise}).pipe(response);

      if (error instanceof Exception && error.errorStack) {
        payload['ErrorStack'] = error.errorStack;
      }
      if (error.httpStatusCode != '404') {
        request.logger.error(error, self.getRequestInfo(request), payload);
      }
    };
  }

  getRequestInfo(request) {
    const requestInfo = {};
    requestInfo.responseTime = (new Date()).getTime() - request.startTime;
    requestInfo.url = request.originalUrl;
    requestInfo.method = request.method;
    requestInfo.inputParameters = {};
    requestInfo.headers = [];
    for (let key in request.params) {
      requestInfo.inputParameters[key] = request.params[key];
    }
    for (let key in request.query) {
      requestInfo.inputParameters[key] = request.query[key];
    }
    for (let key in request.body) {
      requestInfo.inputParameters[key] = request.body[key];
    }
    requestInfo.headers = request.headers;

    if (request.User)
      requestInfo.user = request.User.id;
    else requestInfo.user = 0;

    requestInfo.stats = request.stats;
    return requestInfo;
  }

  async processMiddleware(route, request, response) {
    const len = route.middlewares.length;
    for (let i = 0; i < len; i++) {
      if (!route.middlewares[i].route) {
        const next = await route.middlewares[i].handler(request, response);
        if (!next) {
          return;
        }
      } else if (route.middlewares[i].urlPatternObj.match(url.parse(request.url)['pathname'])) {
        const next = await route.middlewares[i].handler(request, response);
        if (!next) {
          return;
        }
      }
    }
    return true;
  }
}

module.exports = RapidRouter;
