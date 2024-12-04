require('../../helpers/globals');
const _ = require('lodash');
const moment = require('moment-timezone');
const mssql = require('mssql');
const axios = require('axios');
let currantDate;
let currantDateTime;

class AddDivisionIdToBigCommerce {
  constructor() {
  }

  async init(callFromJob) {
    console.info("Add Division Id to Bigcommerce job started...");
    currantDate = moment().tz('America/New_York').format('YYYY-MM-DD');
    currantDateTime = moment.tz('America/New_York').format('YYYY-MM-DD HH:mm:ss');
    let setupSQLConnectionObject = await require('../setupSqlConnection').setupSQLConnections(global.config.mysql.name);
    let connection = await setupSQLConnectionObject.getProxyNodeConnection();
    const mssqlConnection = await mssql.connect(config.mssqlDw);
    try {
      let dimensionData = await this.getDimensionValuesOfCompany(global.config.businessCentral.api.dimensionValue.companyId);
      let businessCentralDivisionList = _.map(dimensionData.value, (obj) => {
        return {divisionId: obj.code, divisionName: obj.displayName, brandName: obj.brandName}
      });
      let placementList = await this.getPlacements(global.config.bigCommerceAuth, global.config.bigCommerceAuth.widgetTemplateUuid)
      console.log('placementList.data.length : ', placementList.data.length);

      let matchCounter = 0;
      let missMatchDivisionName = [];
      for (let obj of placementList.data) {
        let locations = obj.widget.widget_configuration.locations;
        _.forEach(locations, (location) => {
          let matchDivision = _.find(businessCentralDivisionList, (division) => {
            return division.divisionName === location.locationName;
          });
          if (matchDivision) {
            location.divisionId = matchDivision.divisionId;
            matchCounter++;
          } else {
            console.info('Did not get match for Division: location.locationName : ', location.locationName);
            // missMatchDivisionName.push(location);
            location.divisionId = this.findDivisionId(location.locationName);
            console.log('location.divisionId : ', location.divisionId);
          }
          if (location.divisionId === '') {
            missMatchDivisionName.push(location);
          }
        });
          let updateWidgetConfigurationObj = this.getUpdateWidgetConfigurationObj(locations);
          let response = await this.updateBigcommerceWidgetDetail(global.config.bigCommerceAuth, obj.widget.uuid, updateWidgetConfigurationObj);
          console.info('response : ', response);
      }
      console.info('matchCounter : ', matchCounter);
      console.info('missMatchDivisionName.length : ', missMatchDivisionName.length);
      console.info('missMatchDivisionName : ', missMatchDivisionName);

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

  findDivisionId(locationName) {
    let divisionMapping = {
      "San Antanio, TX": '740',
      " Salt Lake City, UT": '912',
      "South Burlington, VT": '263',
      "Ft. Myers, FL": '351',
      "West Columbia, SC": '140',
      "North Charleston, SC": '150',
      "Peachtree City, GA": '302',
      "Summerville, SC": '701',
      "Greenville, SC": '702',
      "Duluth, GA": '703',
      "Raleigh, NC": '705',
      "Clarence, NY": '471',
      "South Easton, MA": '270',
      "Fountain Valley, CA": '730',
      "Cumberland, ME": '260',
      "Cumberland Foreside, ME": '707',
    }
    return divisionMapping[locationName] ? divisionMapping[locationName] : '';
  }


  getUpdateWidgetConfigurationObj(locations) {
    let response = {
      "widget_configuration": {
        locations: locations
      }
    }
    return response;
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


  async updateBigcommerceWidgetDetail(bigCommerceAuth, widgetUuid, data) {
    const headers = {
      'X-Auth-Token': bigCommerceAuth.accessToken,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    let params = {
      url: `https://api.bigcommerce.com/stores/${bigCommerceAuth.storeHash}/v3/content/widgets/${widgetUuid}`,
      method: 'PUT',
      headers: headers,
      data: data
    };
    return axios(params).then((response) => {
      if (response.status >= 200 && response.status < 300) {
        return response.data;
      } else {
        throw false;
      }
    }).catch((error) => {
      throw error;
    });
  }

  async convertToBase64(str) {
    let buf = Buffer.from(str);
    return buf.toString('base64');
  }


}

new AddDivisionIdToBigCommerce().init(true);

module.exports = AddDivisionIdToBigCommerce;
