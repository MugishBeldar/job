const _=require('lodash');
class BaseModel{
	constructor(object){
		if(object){
			Object.keys(object).forEach((key)=>{
				this[key]=object[key];
			});
		}
	}
	static getPrimaryKey(){
		return 'id';
	}
	static async create(connection,object){
		const [result]=await connection.query(`INSERT INTO ${this.getTableName()} SET ?`,object);
		const obj=new this(object);
		const pk=this.getPrimaryKey();
		if(typeof pk == 'string') {
			if (!object[pk]) {
				obj[pk] = result.insertId;
			}
		}
		return obj;
	}

	static async createBulk(connection,arr){
		const [result]=await connection.query(`INSERT INTO ${this.getTableName()} VALUES ?`,[arr]);
		return result;
	}

	static async update(connection,object,condition){
		const cols=Object.keys(object);
		const values=_.map(cols,(column)=>{
			return object[column];
		});
		let query=`UPDATE ${this.getTableName()} SET ${_.map(cols,column=>column+'=?').join(', ')}`;
		if(condition){
			query +=` WHERE ${condition}`;
		}
		const [result]=await connection.query(query,values);
		return result;
	}

  async update(connection,object){
    const cols=Object.keys(object);
    const values=_.map(cols,(column)=>{
      return object[column];
    });
    let query=`UPDATE ${this.getTableName()} SET ${_.map(cols,column=>column+'=?').join(', ')}`;
    query +=` WHERE id = ${this.id}`;
    const [result] = await connection.query(query,values);
    return result;
  }

	static async destroy(connection,condition){
		let query=`DELETE FROM ${this.getTableName()} `;
		if(condition){
			query +=` WHERE ${condition}`;
		}
		const [result]=await connection.query(query);
		return result;
	}
}

module.exports=BaseModel;
