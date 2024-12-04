require('../../helpers/globals');
const Json2csvParser = require('json2csv').Parser;
const fs = require('fs');
const _ = require('lodash');
const moment = require('moment-timezone');
const ejs = require('ejs');
const axios = require('axios');
let currantDate;
let currantDateTime;

class CheckDivisionInfoChange {
  constructor() {
  }

  async init(callFromJob) {
    console.info("Match Division job started...");
    console.log('global.environment : ', global.ENVIRONMENT);
    currantDate = moment().tz('America/New_York').format('YYYY-MM-DD');
    currantDateTime = moment.tz('America/New_York').format('YYYY-MM-DD HH:mm:ss');
    let setupSQLConnectionObject = await require('../setupSqlConnection').setupSQLConnections(global.config.mysql.name);
    let connection = await setupSQLConnectionObject.getProxyNodeConnection();
    try {
      let dimensionData = await this.getDimensionValuesOfCompany(global.config.businessCentral.api.dimensionValue.companyId);
      let updatedDimensionData = await this.getUpdatedAndDeletedDimensionData(dimensionData, currantDateTime);
      let placementList = await this.getPlacements(global.config.bigCommerceAuth, global.config.bigCommerceAuth.widgetTemplateUuid)
      let allLocationsFromBigcommerce = [];
      _.forEach(placementList.data, (placement)=> {
        if (placement.widget && placement.widget.widget_configuration && placement.widget.widget_configuration.locations && placement.widget.widget_configuration.locations.length) {
          let widgetUUID = placement.widget.uuid;
          _.forEach(placement.widget.widget_configuration.locations, (location) => {
            location.widgetUUID = widgetUUID;
            allLocationsFromBigcommerce.push(location);
          })
        }
      });

      let misMatchDataCounter = await this.matchData(connection, updatedDimensionData, allLocationsFromBigcommerce);
      console.info('misMatchDataCounter : ', misMatchDataCounter);
      let mismatchData = await this.fetchMismatchData(connection, currantDate);
      if (mismatchData && mismatchData.length) {
        let changeNotificationUsers = await this.getUsersByADGroupName(global.config.adGroupNames.divisionChangeNotificationUserGroup);
        let notificationUserEmail = _.map(changeNotificationUsers, 'mail');
        await this.sendEmailForMismatchData(mismatchData, notificationUserEmail);
      }
      console.info("Match Division job ended...");
      if (callFromJob) {
        process.exit(0);
      }
    } catch (error) {
      console.info('error : ', error);
      if (callFromJob) {
        process.exit(1);
      }
    }
  }


  async matchData(connection, divisionListFromBusinessCentral, divisionListFromBigcommerce) {
    let updateCounter = 0;
    for (let businessCentralDivision of divisionListFromBusinessCentral) {
      try {
        console.info('businessCentralDivision.displayName : ', businessCentralDivision.displayName);
        let matchBigCommerceDivision = _.filter(divisionListFromBigcommerce, (division) => {
          return division.divisionId === businessCentralDivision.code;
        });
        let widgetUUIDList = _.map(matchBigCommerceDivision, 'widgetUUID');

        let bigCommerceDivision = matchBigCommerceDivision && matchBigCommerceDivision.length ? matchBigCommerceDivision[0] : undefined;
        if (bigCommerceDivision && businessCentralDivision) {
          // update, delete
          let changedField = [];
          if (bigCommerceDivision.locationName) {
            bigCommerceDivision.locationName = bigCommerceDivision.locationName.trim()
          }
          if (bigCommerceDivision.addressLine1) {
            bigCommerceDivision.addressLine1 = bigCommerceDivision.addressLine1.trim()
          }
          if (bigCommerceDivision.addressLine2) {
            bigCommerceDivision.addressLine2 = bigCommerceDivision.addressLine2.trim()
          }
          if (bigCommerceDivision.city) {
            bigCommerceDivision.city = bigCommerceDivision.city.trim()
          }
          if (bigCommerceDivision.state) {
            bigCommerceDivision.state = bigCommerceDivision.state.trim()
          }
          if (bigCommerceDivision.zipCode) {
            bigCommerceDivision.zipCode = bigCommerceDivision.zipCode.trim()
          }

          if (businessCentralDivision.displayName) {
            businessCentralDivision.displayName = businessCentralDivision.displayName.trim()
          }
          if (businessCentralDivision.Address) {
            businessCentralDivision.Address = businessCentralDivision.Address.trim()
          }
          if (businessCentralDivision.adres2) {
            businessCentralDivision.adres2 = businessCentralDivision.adres2.trim()
          }
          if (businessCentralDivision.city) {
            businessCentralDivision.city = businessCentralDivision.city.trim()
          }
          if (businessCentralDivision.state) {
            businessCentralDivision.state = businessCentralDivision.state.trim()
          }
          if (businessCentralDivision.zip) {
            businessCentralDivision.zip = businessCentralDivision.zip.trim()
          }

          if (bigCommerceDivision.locationName !== businessCentralDivision.displayName) {
            changedField.push('divisionName');
          }
          if (bigCommerceDivision.addressLine1 !== businessCentralDivision.Address) {
            changedField.push('address1');
          }
          if (bigCommerceDivision.addressLine2 !== businessCentralDivision.adres2) {
            changedField.push('address2');
          }
          if (bigCommerceDivision.city !== businessCentralDivision.city) {
            changedField.push('city');
          }
          if (bigCommerceDivision.state !== businessCentralDivision.state) {
            changedField.push('state');
          }
          if (bigCommerceDivision.zipCode !== businessCentralDivision.zip) {
            changedField.push('zip');
          }
          let bigCommerceDivisionPhoneString = bigCommerceDivision.phone ? this.getPhoneNumber(bigCommerceDivision.phone) : undefined;
          let businessCentralDivisionPhoneString = businessCentralDivision.phoneNumber ? this.getPhoneNumber(businessCentralDivision.phoneNumber) : undefined;
          if (bigCommerceDivisionPhoneString !== businessCentralDivisionPhoneString) {
            changedField.push('phone');
          }
          if (changedField.length > 0) {
            updateCounter++;
            let businessCentralDivisionObj = {
              divisionName: businessCentralDivision.displayName,
              address1: businessCentralDivision.Address,
              address2: businessCentralDivision.adres2,
              city: businessCentralDivision.city,
              state: businessCentralDivision.state,
              zip: businessCentralDivision.zip,
              phone: businessCentralDivision.phoneNumber,
              createdAt: currantTime(),
              updatedAt: currantTime(),
            };
            let bigCommerceDivisionObj = {
              divisionName: bigCommerceDivision.locationName,
              address1: bigCommerceDivision.addressLine1,
              address2: bigCommerceDivision.addressLine2,
              city: bigCommerceDivision.city,
              state: bigCommerceDivision.state,
              zip: bigCommerceDivision.zipCode,
              phone: bigCommerceDivision.phone,
              widgetIds: widgetUUIDList.toString(),
              createdAt: currantTime(),
              updatedAt: currantTime(),
            };

            if (Object.keys(businessCentralDivisionObj).length > 0 || Object.keys(bigCommerceDivisionObj).length > 0) {
              let businessCentralDivisionResponse = await global.models.BusinessCentralDivision.create(connection, businessCentralDivisionObj);
              let bigCommerceDivisionResponse = await global.models.BigCommerceDivision.create(connection, bigCommerceDivisionObj);
              let requestObj = {
                divisionId: businessCentralDivision.code,
                divisionName: businessCentralDivision.displayName,
                divisionType: businessCentralDivision.type,
                brandName: businessCentralDivision.brandName,
                requestStatus: constant.requestStatus.pendingRequest,
                action: businessCentralDivision.action,
                businessCentralDivisionId: businessCentralDivisionResponse.id,
                bigCommerceDivisionId: bigCommerceDivisionResponse.id,
                changeFieldName: changedField.toString(),
                dateChangeInBC: moment(businessCentralDivision.lastModifiedDateTime, 'YYYY-MM-DDTHH:mm:ssZ').format('YYYY-MM-DD'),
                requestDate: currantDate,
                createdAt: currantTime(),
                updatedAt: currantTime(),
              };
              await global.models.ChangeDivisionRequest.create(connection, requestObj);
            }
          } else {
            console.info("No change found in both data for location: ", businessCentralDivision.displayName);
          }

        } else if (!bigCommerceDivision && businessCentralDivision.action === 'update') {
          let businessCentralDivisionObj = {
            divisionName: businessCentralDivision.displayName,
            address1: businessCentralDivision.Address,
            address2: businessCentralDivision.adres2,
            city: businessCentralDivision.city,
            state: businessCentralDivision.state,
            zip: businessCentralDivision.zip,
            phone: businessCentralDivision.phoneNumber,
            createdAt: currantTime(),
            updatedAt: currantTime(),
          };
          let businessCentralDivisionResponse = await global.models.BusinessCentralDivision.create(connection, businessCentralDivisionObj);

          let requestObj = {
            divisionId: businessCentralDivision.code,
            divisionName: businessCentralDivision.displayName,
            divisionType: businessCentralDivision.type,
            brandName: businessCentralDivision.brandName,
            requestStatus: constant.requestStatus.pendingRequest,
            action: constant.actionType.add,
            businessCentralDivisionId: businessCentralDivisionResponse.id,
            bigCommerceDivisionId: null,
            changeFieldName: null,
            dateChangeInBC: moment(businessCentralDivision.lastModifiedDateTime, 'YYYY-MM-DDTHH:mm:ssZ').format('YYYY-MM-DD'),
            requestDate: currantDate,
            createdAt: currantTime(),
            updatedAt: currantTime(),
          };
          try {
            await global.models.ChangeDivisionRequest.create(connection, requestObj);
          } catch (error) {
            console.log('error : ', error);

          }

        } else {
          console.info('bigCommerceDivision Not Matched: ', bigCommerceDivision);
          console.info('businessCentralDivision : ', businessCentralDivision);
        }
      } catch (error) {
        console.info('error : ', error);
      }
    }
    return updateCounter;
  }

  async sendEmailForMismatchData(mismatchData, notificationUserEmail) {
    try {
      console.log('notificationUserEmail : ', notificationUserEmail);
      _.forEach(mismatchData, (obj)=> {
        if (obj.action) {
          obj.action = obj.action.replace(/\w/, c => c.toUpperCase())
        }
      });
      if (global.ENVIRONMENT !== 'production' && global.ENVIRONMENT !== 'dev') {
        notificationUserEmail = ['sameer.hindocha@rapidops.com'];
      } else if (global.ENVIRONMENT === 'dev') {
        notificationUserEmail = ['sameer.hindocha@rapidops.com', 'jbishop@cookandboardman.com'];
      }
      let applicationUrl = global.config.application.openDoorUrl;
      let emailTemplate = await ejs.renderFile(ROOT_PATH + "/mail-template/mismatch-data.ejs", {
        moment,
        mismatchData,
        applicationUrl
      });

      const emailObj = {
        subject: global.config.divisionChangeEmailSubject,
        html: emailTemplate,
      };
      const emailManager = new EmailManager();
      return await emailManager.sendMail(emailObj, notificationUserEmail);
    } catch (error) {
      console.info('error : ', error);
      throw error;
    }
  }

  async fetchMismatchData(connection, currantDate) {
    let condition = `Request.requestDate = '${currantDate}'`;
    let divisionData = await global.models.ChangeDivisionRequest.getRequestDetail(connection, {rows: 500}, condition);
    for (let changeDivision of divisionData) {
      changeDivision.redirectUrl = `${global.config.application.openDoorUrl}?requestId=${changeDivision.id}`;
      let businessCentralDivisionCondition = `id = ${changeDivision.businessCentralDivisionId}`;
      let bigCommerceDivisionCondition = `id = ${changeDivision.bigCommerceDivisionId}`;
      let businessCentralDivisionDetail = await global.models.BusinessCentralDivision.fetchBusinessCentralDivisionData(connection, businessCentralDivisionCondition);
      let bigCommerceDivisionDetail = await global.models.BigCommerceDivision.fetchBigCommerceDivisionData(connection, bigCommerceDivisionCondition);
      if (businessCentralDivisionDetail) {
        changeDivision.businessCentralDivisionDetail = businessCentralDivisionDetail;
      }
      if (bigCommerceDivisionDetail) {
        changeDivision.bigCommerceDivisionDetail = bigCommerceDivisionDetail;
      }
    }
    return divisionData;
  }

  async getDimensionValuesOfCompany(companyId) {
    const request = require('./../../system/libraries/request');

    let authenticationString = await this.convertToBase64(`${global.CONFIG.businessCentral.api.userName}:${global.CONFIG.businessCentral.api.password}`);
    let endpoint = `${global.CONFIG.businessCentral.api.dimensionValue.baseUrl}/v2.0/${companyId}/dimensionValues`;
    let headers = {
      'Authorization': `Basic ${authenticationString}`
    };
    let params = {
      url: endpoint,
      method: 'GET',
      headers: headers,
      body: {},
      qs: {},
      json: true,
      requestCert: true,
      rejectUnauthorized: false
    };
    let response = await request(params);
    if (response && response.responseBody && response.responseBody.status === 'failure') {
      throw response.responseBody;
    } else {
      try {
        response.responseBody = typeof (response.responseBody) === 'string' ? JSON.parse(response.responseBody) : response.responseBody;
        return response.responseBody;
      } catch (error) {
        console.info(`Error in fetching dimensions for company id ${companyId}`);
        throw error;
      }
    }
  }

  async getUpdatedAndDeletedDimensionData(dimensionData, currantDateTime) {
    let updatedDimensionData = [];
    for (let dimensionDataObj of dimensionData.value) {
      try {
        let startTime = moment(dimensionDataObj.lastModifiedDateTime, 'YYYY-MM-DDTHH:mm:ssZ');
        let endTime = moment(currantDateTime, 'YYYY-MM-DD HH:mm:ss');
        let hoursDiff = endTime.diff(startTime, 'hours');
        console.info(`Hours Difference for ${dimensionDataObj.code}: ${hoursDiff}`);
        if (hoursDiff <= 24) {
          console.info(`hoursDiff : ${hoursDiff} -- ${dimensionDataObj.city}, ${dimensionDataObj.state}`);
          if (constant.divisionList.indexOf(dimensionDataObj.type) > -1) {
            dimensionDataObj.action = constant.actionType.update;
            updatedDimensionData.push(dimensionDataObj);
          } else if (constant.divisionList.indexOf(dimensionDataObj.type) === -1 || dimensionDataObj.Blocked) {
            dimensionDataObj.action = constant.actionType.delete;
            updatedDimensionData.push(dimensionDataObj);
          }
        }
      } catch (error) {
        console.log('error : ', error);

      }

    }

    return updatedDimensionData;
  }

  async getContentPage(bigCommerceAuth, pageName) {
    const headers = {
      'X-Auth-Token': bigCommerceAuth.accessToken,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    let params = {
      name: pageName
    };
    return axios({
      url: `https://api.bigcommerce.com/stores/${bigCommerceAuth.storeHash}/v3/content/pages`,
      method: 'GET',
      headers: headers,
      params: params
    }).then((response) => {
      if (response.status >= 200 && response.status < 300) {
        return response.data;
      } else {
        throw false;
      }
    }).catch((error) => {
      throw error;
    });
  }


  async getPlacements(bigCommerceAuth, widgetTemplateUuid) {
    const headers = {
      'X-Auth-Token': bigCommerceAuth.accessToken,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    let params = {
      widget_template_uuid: widgetTemplateUuid
    };
    return axios({
      url: `https://api.bigcommerce.com/stores/${bigCommerceAuth.storeHash}/v3/content/placements`,
      method: 'GET',
      headers: headers,
      params: params
    }).then((response) => {
      if (response.status >= 200 && response.status < 300) {
        return response.data;
      } else {
        throw false;
      }
    }).catch((error) => {
      throw error;
    });
  }


  async getUsersByADGroupName(groupName) {
    const headers = {
      "content-type": 'application/json',
      "client_id": global.config.accessKey,
      "client_secret": global.config.appPrivateKey
    };
    let endpoint = global.config.dotAPIServer.url + `${constant.apiPrefix.dotIo}/ad/groups/users`;
    return axios({
      url: endpoint,
      method: 'GET',
      headers: headers,
      params: {cn: encodeURIComponent(groupName)},
    }).then((response) => {
      if (response.status >= 200 && response.status < 300) {
        return response.data && response.data.Data ? response.data.Data : response.data;
      }
    }).catch((error) => {
      throw error;
    });
  }

  async convertToBase64(str) {
    let buf = Buffer.from(str);
    return buf.toString('base64');
  }

  getPhoneNumber(number) {
    return number.replace(/\.|-|\(|\)|\s/g, '');
  }


}

new CheckDivisionInfoChange().init(true);

module.exports = CheckDivisionInfoChange;
