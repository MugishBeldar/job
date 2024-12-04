//DBManager class is used to initialize sequelize connection and fetching models for respective database.

require('../../helpers/globals');
const mysql = require('mysql2');

class DBManager{

	static setupMasterNodeDBConnectionPool() {
		// create the pool
		const pool = mysql.createPool({
			host: global.CONFIG.mysql.hostForReadWrite,
			port: global.CONFIG.mysql.portForReadWrite,
			user: global.CONFIG.mysql.username,
			password: global.CONFIG.mysql.password,
			waitForConnections: true,
			connectionLimit: global.CONFIG.mysql.poolSize
		});
		const promisePool = pool.promise();
		global.masterConnectionPool = promisePool;
	}

	static setupProxyNodeDBConnectionPool() {
		// create the pool
		const pool = mysql.createPool({
			host: global.CONFIG.mysql.host,
			port: global.CONFIG.mysql.port,
			user: global.CONFIG.mysql.username,
			password: global.CONFIG.mysql.password,
			waitForConnections: true,
			connectionLimit: global.CONFIG.mysql.poolSize
		});
		const promisePool = pool.promise();
		global.proxyConnectionPool = promisePool;
	}

	static async getMasterNodeConnection (hostname){
		try {
			if(!global.masterConnectionPool) {
				DBManager.setupMasterNodeDBConnectionPool();
			}
			const connection = await global.masterConnectionPool.getConnection();
			await connection.changeUser({
				database: global.CONFIG.mysql.name
			});
			return connection;
		} catch (e) {
			throw e;
		}
	}

	static async getProxyNodeConnection(hostname){
		try {
			if(!global.proxyConnectionPool) {
				DBManager.setupProxyNodeDBConnectionPool()
			}
			const connection = await global.proxyConnectionPool.getConnection();
			await connection.changeUser({
				database: global.CONFIG.mysql.name
			});
			return connection;
		} catch (e) {
			throw e;
		}
	}
}

module.exports=DBManager;
