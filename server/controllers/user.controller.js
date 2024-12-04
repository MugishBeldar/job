'use strict';
const _ = require('lodash');
const request = require('../system/libraries/request');
const constant = require('../constant');

class UserController {
  constructor(app) {
    const apiPrefix = constant.apiPrefix.application;
    app.get(`${apiPrefix}/user-detail/:id`, (req, res) => {
      this.getUserDetail(req, res);
    });
    app.get(`${apiPrefix}/user`, (req, res) => {
      this.getUserByToken(req, res);
    });
    
  }

  async getUserData(userDetail, dimensionValuesUserDetail) {
    try {
      userDetail.divisionDetail = _.map(dimensionValuesUserDetail, (dimensionValue) => {
        return {
          divisionId: dimensionValue.code,
          divisionName: dimensionValue.name,
          firstName: dimensionValue.firstName,
          lastName: dimensionValue.lastName,
          region: dimensionValue.region,
          divisionLead: dimensionValue.divisionLead,
          operationsManager: dimensionValue.operationsManager,
          regionalController: dimensionValue.regionalController,
          districtManager: dimensionValue.districtManager,
          regionalVicePresident: dimensionValue.regionalVicePresident,
          salesManager: dimensionValue.salesManager,
          rOMs: dimensionValue.rOMs,
        }
      });
      userDetail.divisionDetail = _.uniqBy(userDetail.divisionDetail, 'divisionId');
      return userDetail;
    } catch (error) {
      console.log('error : ', error);
      throw error;
    }
  }
  async getUserDetail(req, res) {
    let userId = req.params.id;
    let connection = await req.getProxyNodeConnection();
    try {
      const condition = `id='${userId}'`;
      let isComsense = false;
      let [userDetail] = await global.models.User.getUser(connection, condition);
      if (userDetail) {
        let dimensionValuesUserDetail = await UserController.getDimensionValuesDivisionDetail(req.headers.accesstoken, userDetail.displayName);
        // let userType = await UserController.getUserType(dimensionValuesUserDetail, userDetail.cn, connection);
        userDetail = await this.getUserData(userDetail, dimensionValuesUserDetail);
      }
      // userDetail.userType = userType.toString();
      if (connection) {
        connection.release();
        connection = null;
      }
      res.sendResponse(userDetail);
    } catch (err) {
      if (connection) {
        connection.release();
        connection = null;
      }
      res.sendError(err);
    }
  }

  async getUserByToken(req, res) {
    let accessToken = req.query.token;
    let connection = await req.getMasterNodeConnection();
    try {
      if (!accessToken) {
        throw new Exception('ValidationError', 'Please provide access token');
      }
      let dotIoUserDetail = await getDotIoCurrantUser(accessToken);
      // console.info('dotIoUserDetail : ', dotIoUserDetail);
      let dimensionValuesUserDetail = await UserController.getDimensionValuesDivisionDetail(accessToken, dotIoUserDetail.displayName);
      // let userType = await UserController.getUserType(dimensionValuesUserDetail, dotIoUserDetail.cn, connection);
      let userDetail = await createLocalUser(connection, dotIoUserDetail, accessToken, dimensionValuesUserDetail);
      userDetail.divisionDetail = _.map(dimensionValuesUserDetail, (dimensionValue) => {
        return {
          divisionId: dimensionValue.code,
          divisionName: dimensionValue.name,
          firstName: dimensionValue.firstName,
          lastName: dimensionValue.lastName,
          region: dimensionValue.region,
          divisionLead: dimensionValue.divisionLead,
          operationsManager: dimensionValue.operationsManager,
          regionalController: dimensionValue.regionalController,
          districtManager: dimensionValue.districtManager,
          regionalVicePresident: dimensionValue.regionalVicePresident,
          salesManager: dimensionValue.salesManager,
          rOMs: dimensionValue.rOMs
        }
      });
      userDetail.divisionDetail = _.uniqBy(userDetail.divisionDetail, 'divisionId');
      // console.info('userDetail : ', userDetail);
      if (connection) {
        connection.release();
        connection = null;
      }
      res.sendResponse(userDetail);
    } catch (err) {
      console.log('err', err);
      if (connection) {
        connection.release();
        connection = null;
      }
      res.sendError(err);
    }
  }

  static async getDimensionValuesDivisionDetail(accessToken, cn) {
    let apiPrefix = constant.apiPrefix.dotIo;
    let headers = {
      "content-type": 'application/json',
      accessToken: accessToken
    };
    let endpoint = `${apiPrefix}/user/division`;
    let params = {
      url: global.config.dotAPIServer.url + endpoint,
      method: 'GET',
      headers: headers,
      qs: {cn: encodeURIComponent(cn)},
      json: true,
      requestCert: true,
      rejectUnauthorized: false
    };
    let response = await request(params);
    if (response && response.responseBody && response.responseBody.Status === 'failure') {
      throw  response.responseBody.Error;
    } else {
      try {
        response.responseBody = typeof (response.responseBody) === 'string' ? JSON.parse(response.responseBody) : response.responseBody;
        return response.responseBody.Data;
      } catch (error) {
        throw  {status: response.response.statusCode, message: response.responseBody};
      }
    }
  }
}


function getUserApplicationGroup(allGroups) {
  let groupName = '';
  for (let key in global.config.adGroupNames) {
    if (allGroups.indexOf(global.config.adGroupNames[key]) > -1 && groupName.indexOf(global.config.adGroupNames[key]) === -1) {
      if (groupName) {
        groupName += ',';
      }
      groupName += global.config.adGroupNames[key];
    }
  }
  return groupName;
}

async function createLocalUser(connection, dotIoUserDetail, accessToken, dimensionValuesUserDetail) {
  try {
    // let paylocityEmployeeId = dimensionValuesUserDetail && dimensionValuesUserDetail.length > 0 && dimensionValuesUserDetail[0].employeeId ? dimensionValuesUserDetail[0].employeeId : undefined;
    let userCondition = `id=${dotIoUserDetail.id}`;
    let [user] = await global.models.User.getUser(connection, userCondition);
    let userGroup = getUserApplicationGroup(dotIoUserDetail.userGroup);
    // let userType = await UserController.getUserType(dimensionValuesUserDetail, connection, userGroup);
    let userType = userGroup;
    // console.log('user : ', user);
    // console.log('userGroup : ', userGroup);
    // console.log('userType : ', userType);

    if (dotIoUserDetail.displayName && constant.allPermissionUserList.indexOf(dotIoUserDetail.displayName) > -1) {
      let groupType = [global.config.adGroupNames.divisionChangeNotificationUserGroup];
      userType = groupType;
      userGroup = groupType;
    }

    if (!user) {
      let createObj = {
        id: dotIoUserDetail.id,
        objectId: dotIoUserDetail.objectId,
        displayName: dotIoUserDetail.displayName || null,
        firstName: dotIoUserDetail.firstName || null,
        lastName: dotIoUserDetail.lastName || null,
        email: dotIoUserDetail.email || null,
        jobTitle: dotIoUserDetail.jobTitle || null,
        userPrincipalName: dotIoUserDetail.userPrincipalName || null,
        officeLocation: dotIoUserDetail.officeLocation || null,
        userGroup: userGroup,
        userType,
        paylocityEmployeeId: dotIoUserDetail.employeeId || null,
        divisionId: dotIoUserDetail.divisionNumber || null,
        lastLoginTime: currantTime(),
        createdAt: currantTime(),
        updatedAt: currantTime()
      };
      // console.log('dotIoUserDetail.memberOf', dotIoUserDetail.memberOf);
      // console.log('createObj.userGroup', createObj.userGroup);
      return await global.models.User.create(connection, createObj);
    } else {
      let updateUserObj = {};
      if (user.displayName !== dotIoUserDetail.displayName) {
        updateUserObj.displayName = dotIoUserDetail.displayName;
      }
      if (user.firstName !== dotIoUserDetail.firstName) {
        updateUserObj.firstName = dotIoUserDetail.firstName;
      }
      if (user.lastName !== dotIoUserDetail.lastName) {
        updateUserObj.lastName = dotIoUserDetail.lastName;
      }
      if (user.email !== dotIoUserDetail.email) {
        updateUserObj.email = dotIoUserDetail.email;
      }
      if (user.jobTitle !== dotIoUserDetail.jobTitle) {
        updateUserObj.jobTitle = dotIoUserDetail.jobTitle;
      }
      if (user.userPrincipalName !== dotIoUserDetail.userPrincipalName) {
        updateUserObj.userPrincipalName = dotIoUserDetail.userPrincipalName;
      }
      if (user.officeLocation !== dotIoUserDetail.officeLocation) {
        updateUserObj.officeLocation = dotIoUserDetail.officeLocation;
      }
      if (user.paylocityEmployeeId !== dotIoUserDetail.employeeId) {
        updateUserObj.paylocityEmployeeId = dotIoUserDetail.employeeId;
      }
      if (user.divisionId !== dotIoUserDetail.divisionNumber) {
        updateUserObj.divisionId = dotIoUserDetail.divisionNumber;
      }

      // console.log('dotIoUserDetail.userGroup : ', dotIoUserDetail.userGroup);
      if (user.userGroup !== userGroup) {
        updateUserObj.userGroup = userGroup;
      }
      if (user.userType !== userType) {
        updateUserObj.userType = userType;
      }

      if (Object.values(updateUserObj).length > 0) {
        updateUserObj.updatedAt = currantTime();
      }
      updateUserObj.lastLoginTime = currantTime();
      console.log('updateUserObj', updateUserObj);

      let condition = `id=${dotIoUserDetail.id}`;
      let updatedUserDetail = await global.models.User.update(connection, updateUserObj, condition);
      let [userData] = await global.models.User.getUser(connection, condition);
      // console.log('updated user detail : ', userData);
      return userData;
    }
  } catch (error) {
    console.log('error : ', error);
    throw error;
  }
}

async function getDotIoCurrantUser(token) {
  const apiPrefix = constant.apiPrefix.dotIo;
  let headers = {
    accesstoken: token,
    "content-type": 'application/json'
  };
  let endpoint = `${apiPrefix}/getCurrentUser`;
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
    throw response.responseBody.Error;
  } else {
    try {
      response.responseBody = typeof (response.responseBody) === 'string' ? JSON.parse(response.responseBody) : response.responseBody;
      return response.responseBody.Data;
    } catch (error) {
      console.log('error : ', error);
      throw {status: response.response.statusCode, message: response.responseBody};
    }
  }
}


module.exports = UserController;
