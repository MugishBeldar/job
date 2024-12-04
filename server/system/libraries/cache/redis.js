function Redis(options) {
	const Redis = require('ioredis');
	const bfj = require('bfj');
	const yj = require('yieldable-json');
	const redisOptions = {
		password: options.password
	};
	if (options.sentinels) {
		redisOptions.sentinels = options.sentinels;
		redisOptions.name = options.name;
	} else {
		redisOptions.host = options.host;
	}
	let client = new Redis(redisOptions);
	
	this.delByPreix = function (prefix, callback) {
		client.keys(`${prefix}*`, function (err, keys) {
			// let i = 0;
			// async.whilst(() => {
			// 		i > keys.length;
			// 	},
			// 	(next) => {
			// 		client.del()
			// 	},
			// 	(err) => {
			// 	});
			console.log(keys);
			client.del(keys, callback);
		});
	};
	this.get = function (key, callback) {
		client.get(key, function (err, data) {
			if (data) {
				try {
					yj.parseAsync(data, (err, keyData) => {
						callback(null, keyData['data']);
					});
				} catch (e) {
					console.error(e.message);
					return callback(e);
				}
			} else {
				callback(err);
			}
		});
	};
	this.set = async function (key, data, lifetime, callback) {
		const keyData = {data: data};
		const json = await bfj.stringify(keyData);
		client.set(key, json, function (err, resp) {
			if (err) {
				callback(err);
			} else {
				client.expire(key, lifetime, callback);
			}
		});
		
	};
	this.del = function (key, callback) {
		client.del(key, callback);
	};
	
}
exports.Redis = Redis;