var Memcached = require('memcached');

function Memcache(server,options){
	var memcached=new Memcached(server,options);
	
	this.get=function(key,callback){
		memcached.get(key, function (err, data) {
			if(err) callback(err);
  			else callback(null,data);
		});
	}
	this.set=function(key,data,lifetime,callback){
		memcached.set(key,data,lifetime,callback);
	}
	this.del=function(key,callback){
		memcached.del(key, callback);
	}

}

exports.Memcache=Memcache;