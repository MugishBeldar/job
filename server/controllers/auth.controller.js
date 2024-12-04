const axios = require('axios');

class AuthController {
  constructor(router) {
    router.post('/api/v1/login', (req, res) => {
      this.login(req, res);
    });

    router.get('/api/v1/logout', (req, res) => {
      this.logout(req, res);
    });

    router.post('/api/v1/ms-refresh-token', (req, res) => {
      this.getAccessTokenUsingMicrosoftRefreshToken(req, res);
    });
  }

  async login(req, res) {
    try {
      let accessToken;
      if (req.body.grant_type && req.body.grant_type === 'authorization_code') {
        if (!req.body.code) {
          throw new Exception('ValidationError', 'Please provide valid code.')
        }
        let body = {
          grant_type: req.body.grant_type, code: req.body.code,
        };
        accessToken = await this.getAccessTokenForAuthorizationCodeGrantType(body);
      } else {
        throw new Exception('InvalidAuthRequest', 'Please provide valid grant type.');
      }
      res.sendResponse(accessToken);
    } catch (error) {
      console.log('error', error);
      res.sendError(error);
    }
  }

  async getAccessTokenForAuthorizationCodeGrantType(body) {
    try {
      let headers = {
        appaccesskey: global.config.accessKey,
        appprivatekey: global.config.appPrivateKey,
        "content-type": 'application/json'
      };
      let endpoint = '/api/v1/azure-ad/token';
      const axiosConfig = {
        url: `${global.config.dotAPIServer.url}${endpoint}`,
        method: 'POST',
        headers: headers,
        data: body,
      };
      let response = await axios(axiosConfig);
      if (response.status >= 200 && response.status < 300) {
        return response && response.data && response.data.Data ? response.data.Data : {};
      } else {
        throw response;
      }
    } catch (error) {
      console.log('Error in getAccessTokenForAuthorizationCodeGrantType: ', error);
      throw error && error.response && error.response.data ? error.response.data : error;
    }
  }

  async logout(req, res) {
    let userId = req.user.id;
    let accessToken = req.headers.accesstoken;
    let appAccessKey = req.headers.appaccesskey || global.config.accessKey;
    try {
      if (!userId) {
        throw new Exception('ValidationError', 'Please provide valid user id.');
      }
      let requestBodyObj = {
        grantType: 'authorization_code', userId: userId, accessToken: accessToken, appAccessKey: appAccessKey,
      };
      await this.dotIoLogout(requestBodyObj);
      res.sendResponse({}, true);
    } catch (err) {
      console.error('Error in logout', err);
      res.sendError(err);
    }
  }

  async dotIoLogout(body) {
    try {
      let headers = {
        "content-type": "application/json"
      };
      let endpoint = '/api/v1/logout';
      const config = {
        url: `${global.config.dotAPIServer.url}${endpoint}`,
        method: 'POST',
        headers: headers,
        data: body,
      };
      let response = await axios(config);
      if (response.status >= 200 && response.status < 300) {
        return response && response.data && response.data.Data ? response.data.Data : {};
      } else {
        throw response;
      }
    } catch (error) {
      console.log('Error in dotIoLogout: ', error);
      throw error && error.response && error.response.data ? error.response.data : error;
    }
  }

  async getAccessTokenUsingMicrosoftRefreshToken(req, res) {
    try {
      let refreshToken = req.body.refreshToken || null;
      if (!refreshToken) {
        throw new Exception('ValidationError', 'Please provide valid refresh token.');
      }
      let accessTokenObj = await this.getAccessTokenUsingMicrosoftRefreshTokenFromDotIo(refreshToken);
      res.sendResponse(accessTokenObj);
    } catch (err) {
      console.log('error', err);
      res.sendError(err);
    }
  }

  async getAccessTokenUsingMicrosoftRefreshTokenFromDotIo(refreshToken) {
    try {
      let headers = {
        appaccesskey: global.config.accessKey,
        appprivatekey: global.config.appPrivateKey,
        "content-type": 'application/json'
      };
      let endpoint = '/api/v1/azure-ad/ms-refresh-token';
      const config = {
        url: `${global.config.dotAPIServer.url}${endpoint}`,
        method: 'POST',
        headers: headers,
        data: {
          refreshToken, grant_type: 'refresh_token',
        },
      };
      let response = await axios(config);
      if (response.status >= 200 && response.status < 300) {
        return response && response.data && response.data.Data ? response.data.Data : {};
      } else {
        throw response;
      }
    } catch (error) {
      console.log('Error in getAccessTokenUsingMicrosoftRefreshTokenFromDotIo: ', error);
      throw error && error.response && error.response.data ? error.response.data : error;
    }
  }

}

module.exports = AuthController;
