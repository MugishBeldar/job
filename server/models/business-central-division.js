const moment = require('moment');
const BaseModel = require('../base-model');
const _ = require('lodash');

class BusinessCentralDivision extends BaseModel {

  constructor(connection) {
    super(connection);
  }

  static getTableName() {
    return 'business_central_division';
  }

  static async fetchBusinessCentralDivisionData(connection, condition) {
    let query = `SELECT * FROM ${this.getTableName()}
            WHERE ${condition}`;
    let [[response]] = await connection.query(query);
    return response;
  }


}

module.exports = BusinessCentralDivision;
