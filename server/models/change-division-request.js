const moment = require('moment');
const BaseModel = require('../base-model');
const _ = require('lodash');

class ChangeDivisionRequest extends BaseModel {

  constructor(connection) {
    super(connection);
  }

  static getTableName() {
    return 'change_division_request';
  }


  static async getRequestDetail(connection, queryParams = {}, condition) {
    let pageNo = 1,
      rows = 10,
      sortObj = {null: 1},
      sortOrder = 'DESC',
      sortBy = 'dateChangeInBC';

    if (queryParams.rows) {
      rows = parseInt(queryParams.rows);
    }
    if (queryParams.pageNo) {
      pageNo = parseInt(queryParams.pageNo);
    }

    if (queryParams.sortOrder && queryParams.sortBy) {
      sortOrder = queryParams.sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      sortBy = queryParams.sortBy;
    }

    let offset = ((pageNo - 1) * rows);



    let query = `SELECT Request.*, User.firstName AS actionUserFirstName, User.lastName AS actionUserLastName FROM ${this.getTableName()} AS Request
                 LEFT JOIN ${global.models.User.getTableName()} AS User ON User.id = Request.actionTakenBy`;
    if (condition) {
      query += ` WHERE ${condition}`;
    }
    query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ${offset},${rows}`;
    console.log('query', query);
    const [result] = await connection.query(query);
    return result;
  }

  static async getRequestCount(connection, condition) {
    let query = `SELECT count(*) AS count FROM ${this.getTableName()}`;
    if (condition) {
      query += ` WHERE ${condition}`;
    }
    console.log('query', query);
    const [result] = await connection.query(query);
    return result;
  }

}

module.exports = ChangeDivisionRequest;
