var mysql = require('mysql');
global.mysql=mysql;
var connection_pool  = mysql.createPool({
		host 		:CONFIG.mysql.host,
	port	 	: CONFIG.mysql.port,
	user     	: CONFIG.mysql.username,
	password 	: CONFIG.mysql.password,
	connectionLimit: CONFIG.mysql.pool_size,
	connectTimeout:5000
});
function DB(){
	var _table="";

	this.init=function(table){
		_table=table;
	}
	this.select=function(fields,condition,callback){
		//var options = {sql: query, nestTables: true};
		var query='SELECT '+fields+' FROM '+_table+' WHERE '+condition;

		this.db_connection.query(query, function(err, rows) {
			if(err) {
				logger.log('error',err);
			}
			callback(err,rows);
		});	
	}
}
DB.getDBConnection=function(db_name,callback){
	connection_pool.getConnection(function(conn_err,connection){
		if(conn_err){
			callback(conn_err);
			return;
		}
		connection.changeUser({database : db_name}, function(err) {
			if (err) callback(err);
			else callback(null,connection);
		});
	});
}

/*DB.prototype.insert=function(options,callback){
	var obj=this;
	connection_pool.getConnection(function(conn_err,connection){
		if(conn_err){
			logger.log('error',conn_err);
			callback(conn_err);
			return;
		}
		connection.query('INSERT INTO '+obj._table+' SET ?',options,function(err,result){
			connection.release();
			if(err) {
				if(err.code!="ER_DUP_ENTRY")
					logger.log('info',err);
			}
			callback(err,result);
		});
	});
}
DB.prototype.replace=function(options,callback){
	var obj=this;
	connection_pool.getConnection(function(conn_err,connection){
		if(conn_err){
			logger.log('error',conn_err);
			callback(conn_err);
			return;
		}
		connection.query('REPLACE INTO '+obj._table+' SET ?',options,function(err,result){
			connection.release();
			if(err) logger.log('error',err);
			callback(err,result);
		});
	});
}
DB.prototype.update=function(options,condition,callback){
	var obj=this;
	connection_pool.getConnection(function(conn_err,connection){
		if(conn_err){
			logger.log('error',conn_err);
			callback(conn_err);
			return;
		}
		connection.query('UPDATE '+obj._table+' SET ? WHERE ?',[options,condition],function(err,result){
			connection.release();
			if(err) logger.log('error',err);
			callback(err,result);
		});
	});
}*/
module.exports=DB;
