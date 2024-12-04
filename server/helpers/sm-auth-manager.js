const _ = require('lodash');
const moment = require('moment');
const q = require('q');
const request = require('../system/libraries/request');
const constant = require('../constant');
const UserController = require('../controllers/user.controller');

class AuthManager {
  constructor(publicPaths, bypassedPaths, completelyByPassedPaths, genericPaths, isPublic) {
    if (isPublic) {
      this.isPublicServer = true;
    }
    this.bypassedPaths = _.map(bypassedPaths, (path) => {
      return new RegExp(path, 'i');
    });
    this.completelyByPassedPaths = _.map(completelyByPassedPaths, (path) => {
      return new RegExp(path, 'i');
    });
    this.publicPaths = _.map(publicPaths, (path) => {
      return new RegExp(path, 'i');
    });
    this.genericPaths = _.map(genericPaths, (path) => {
      return new RegExp(path, 'i');
    });
  }

  async authorize(req) {
    //Handling Generic domain
    // if (req.linkName == global.genericDomain) {
    // 	// this.handleGenericDomainAuth(req.url);
    // 	req.isGenericPath = true;
    // 	return;
    // }
    if (__lodash.find(this.publicPaths, function (path) {
      return req.url.match(path);
    })) {
      req.publicPaths = true;
      return;
    }

    if (this.isPublicServer && !req.publicPaths) {
      throw new Exception('Forbidden', 'You can not access this route.');
    }

    //Handling completely by passed paths
    if (__lodash.find(this.completelyByPassedPaths, function (path) {
      return req.url.match(path);
    })) {
      req.completelyByPassedPaths = true;
      return;
    }

    //Handling bypassed paths which requires just access key and secret
    if (__lodash.find(this.bypassedPaths, function (path) {
      return req.url.match(path);
    })) {
      await this.handleByPassedPath(req);
      return;
    }

    //Handle normal request
    await this.handleRegularRequest(req);
  }

  async handleRegularRequest(req) {
    let sessionToken = req.headers.accesstoken || req.headers.sessiontoken;
    let userInfo = await this.getUser(req, sessionToken);
    if (userInfo && userInfo.user && userInfo.application && userInfo.token) {
      const currantTime = moment().utc().unix();
      if (userInfo.token.expiresAt === 0 || userInfo.token.expiresAt >= currantTime) {
        req.user = userInfo.user;
        req.application = userInfo.application;
        // await this.validateUser(req);
      } else {
        throw new Exception("SessionExpired", "Session expired"); //Token Expired
      }
    } else {
      console.log("Error========>", req.url);
      console.log('userInfo.user', userInfo.user);
      console.log('userInfo.application', userInfo.application);

      console.log("<========Logout========>");
      throw new Exception("AuthorizationFailed", "Invalid access token"); //Invalid Token
    }
  }

  async getUser(req, sessionToken) {
    let connection = await req.getProxyNodeConnection();
    try {
      let userDetail = await getUserBySessionToken(sessionToken);
      let condition = `id=${userDetail.user.id}`;
      let isComsense = false;
      let [localUser] = await global.models.User.getUser(connection, condition);
      let dimensionValuesUserDetail = await UserController.getDimensionValuesDivisionDetail(sessionToken, localUser.cn);
      localUser.divisionDetail = _.map(dimensionValuesUserDetail,(dimensionValue)=>{
        return {divisionId: dimensionValue.code, divisionName: dimensionValue.name, firstName: dimensionValue.firstName, lastName: dimensionValue.lastName,  region: dimensionValue.region, divisionLead: dimensionValue.divisionLead, operationsManager: dimensionValue.operationsManager, regionalController: dimensionValue.regionalController, districtManager: dimensionValue.districtManager, regionalVicePresident: dimensionValue.regionalVicePresident, salesManager: dimensionValue.salesManager, rOMs: dimensionValue.rOMs}
      });
      localUser.divisionDetail = _.uniqBy(localUser.divisionDetail, 'divisionId');
      userDetail.user = localUser;
      if (connection) {
        connection.release();
        connection = null;
      }
      return {
        user: userDetail.user,
        application: userDetail.application,
        token: userDetail.token
      };
    } catch (error) {
      console.log('error', error);
      if (connection) {
        connection.release();
        connection = null;
      }
      return false;
    }
  }

  async validateUser(req) {
    /*    if (req.url.indexOf('/bm/') > -1 && (req.user.userGroup !== global.config.adGroupNames.bmGroupName && req.user.userGroup !== global.config.adGroupNames.delegateGroupName)) {
          throw new Exception("Forbidden");
        }
        if (req.url.indexOf('/dm/') > -1 && req.user.userGroup !== global.config.adGroupNames.dmGroupName) {
          throw new Exception("Forbidden");
        }
        if (req.url.indexOf('/rvp/') > -1 && req.user.userGroup !== global.config.adGroupNames.rvpGroupName) {
          throw new Exception("Forbidden");
        }
        if (req.url.indexOf('/ca/') > -1 && req.user.userGroup !== global.config.adGroupNames.caGroupName) {
          throw new Exception("Forbidden");
        }*/

    console.log('req.url~~~~~>', req.url);

    let isMatchBMPath = __lodash.find(constant.bmApiUrl, (path) => {
      return req.url.match(path);
    });
    let isMatchDelegatePath = __lodash.find(constant.delegateApiUrl, (path) => {
      return req.url.match(path);
    });
    let isMatchDMPath = __lodash.find(constant.dmApiUrl, (path) => {
      return req.url.match(path);
    });
    let isMatchRVPPath = __lodash.find(constant.rvpApiUrl, (path) => {
      return req.url.match(path);
    });
    let isMatchCAPath = __lodash.find(constant.caApiUrl, (path) => {
      return req.url.match(path);
    });
    let isMatchAdminPath = __lodash.find(constant.adminApiUrl, (path) => {
      return req.url.match(path);
    });
    let isMatchReportPath = __lodash.find(constant.reportApiUrl, (path) => {
      return req.url.match(path);
    });
    let isMatchCommonPath = __lodash.find(constant.commonApiUrl, (path) => {
      return req.url.match(path);
    });
    console.log('isMatchBMPath', isMatchBMPath);
    console.log('isMatchDelegatePath', isMatchDelegatePath);
    console.log('isMatchDMPath', isMatchDMPath);
    console.log('isMatchRVPPath', isMatchRVPPath);
    console.log('isMatchCAPath', isMatchCAPath);
    console.log('isMatchAdminPath', isMatchAdminPath);
    console.log('isMatchReportPath', isMatchReportPath);
    console.log('isMatchCommonPath', isMatchCommonPath);


    let userGroup = req.user.userGroup;
    console.log('userGroup', userGroup);

    if (userGroup === global.CONFIG.adGroupNames.bmGroupName && !isMatchBMPath && !isMatchCommonPath) {
      throw new Exception("Forbidden", "Access Denied.");
    }
    if (userGroup === global.CONFIG.adGroupNames.delegateGroupName && !isMatchDelegatePath && !isMatchCommonPath) {
      throw new Exception("Forbidden", "Access Denied.");
    }
    if (userGroup === global.CONFIG.adGroupNames.dmGroupName && !isMatchDMPath && !isMatchCommonPath) {
      throw new Exception("Forbidden", "Access Denied.");
    }
    if (userGroup === global.CONFIG.adGroupNames.rvpGroupName && !isMatchRVPPath && !isMatchCommonPath) {
      throw new Exception("Forbidden", "Access Denied.");
    }
    if (userGroup === global.CONFIG.adGroupNames.caGroupName && !isMatchCAPath && !isMatchCommonPath) {
      throw new Exception("Forbidden", "Access Denied.");
    }
    if ((userGroup === global.CONFIG.adGroupNames.readOnlyGroupName) && !isMatchReportPath && !isMatchCommonPath) {
      throw new Exception("Forbidden", "Access Denied.");
    }
    if (userGroup === global.CONFIG.adGroupNames.dotIOAdminGroupName && !isMatchAdminPath && !isMatchCommonPath) {
      throw new Exception("Forbidden", "Access Denied.");
    }

  }

  async handleByPassedPath(req) {
    let authAccessKey = req.headers.appaccesskey || req.query.appaccesskey;
    // let authPrivateKey = req.headers.appprivatekey;

    if (authAccessKey === '' || authAccessKey === undefined) {
      throw new Exception('InvalidAuthRequest', 'Application Access Key missing');
    }
    // if (authPrivateKey === '' || authPrivateKey === undefined) {
    //   throw new Exception('InvalidAuthRequest', 'Application Secret Key missing');
    // }

    let connection = await req.getProxyNodeConnection();
    await connection.changeUser({
      database: global.CONFIG.mysql.dotIoDb
    });
    const [result] = await connection.query(`SELECT * FROM applications WHERE accessKey = ? `, [authAccessKey]);
    await connection.changeUser({
      database: global.CONFIG.mysql.Capex
    });
    if (connection) {
      connection.release();
      connection = null;
    }
    if (result.length > 0) {
      req.application = result[0];
      req.bypassedPaths = true;
    } else {
      req.bypassedPaths = true; // TODO - remove
      // throw new Exception('InvalidAuthRequest', 'Invalid Access Key.');
    }
  }


}

async function getUserBySessionToken(accessToken) {
  let deferred = q.defer();
  let apiPrefix = constant.apiPrefix.dotIo;

  let headers = {
    accesstoken: accessToken,
    "content-type": 'application/json'
  };
  let endpoint = `${apiPrefix}/get-session-user`;
  let params = {
    url: global.config.dotAPIServer.url + endpoint,
    method: 'GET',
    headers: headers,
    qs: {},
    json: true,
    requestCert: true,
    rejectUnauthorized: false
  };

  let response = await request(params);
  if (response && response.responseBody && response.responseBody.Status === 'failure') {
    deferred.reject(response.responseBody.Error);
  } else {
    try {
      response.responseBody = typeof (response.responseBody) === 'string' ? JSON.parse(response.responseBody) : response.responseBody;
      deferred.resolve(response.responseBody.Data);
    } catch (e) {
      deferred.reject({status: response.response.statusCode, message: response.responseBody});
    }
  }
  return deferred.promise;
}

module.exports = (bypassedPaths, completelyByPassedPaths, genericPaths) => {
  const authManager = new AuthManager(bypassedPaths, completelyByPassedPaths, genericPaths);
  return async function authManagerMiddleware(req, res, next) {
    try {
      req.stats['m5-auth-manager'] = time();
      await authManager.authorize(req);
      if (next) {
        next();
      } else {
        return true;
      }
    } catch (e) {
      res.sendError(e);
      return false;
    }
  };
};
