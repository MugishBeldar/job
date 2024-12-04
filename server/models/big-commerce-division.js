const moment = require('moment');
const BaseModel = require('../base-model');
const _ = require('lodash');

class BigCommerceDivision extends BaseModel {

  constructor(connection) {
    super(connection);
  }

  static getTableName() {
    return 'bigCommerce_division';
  }

  static async fetchBigCommerceDivisionData(connection, condition) {
    let query = `SELECT * FROM ${this.getTableName()}
                 WHERE ${condition}`;
    let [[response]] = await connection.query(query);
    return response;
  }

}

module.exports = BigCommerceDivision;
