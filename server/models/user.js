const BaseModel = require('../base-model');

class User extends BaseModel {
  constructor(connection) {
    super(connection);
  }

  static getTableName() {
    return 'users';
  }

  getTableName() {
    return 'users';
  }

  static async createUser(connection, userObject) {}


  static async getUser(connection, condition) {
    let query = `SELECT * from ${this.getTableName()} AS User`;
    if(condition){
      query += ` WHERE ${condition}`
    }
    console.log('query', query);
    const [result] = await connection.query(query);
    return result;
  }




}

module.exports = User;
