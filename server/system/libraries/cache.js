function Cache(config){
	let obj={};
	let that=this;
	let caching_enabled=(config.enabled=='Y'?true:false);
	let serverType=config.server_type;
	let server=config.servers;
	let options=config.options;
	if(caching_enabled){
		if(serverType==='memcached'){
			let Memcache=require('./cache/memcache.js').Memcache;
			obj = new Memcache(server,options);
		}else if (serverType==='redis'){
			let Redis=require('./cache/redis.js').Redis;
			obj = new Redis(options);
		}
	}

	function get(key,callback){
		obj.get(key,callback);
	}
	function set(key,data,lifetime,callback){
		obj.set(key,data,lifetime,callback);
	}
	this.get=get;
	this.set=set;
	this.del=function(key,callback){
		obj.del(key,callback);
	};
	this.delByPrefix=function(prefix,callback){
		obj.delByPreix(prefix,callback);
	};
	this.fetch=function(key,lifetime,fetch_value_func,callback){
		if(caching_enabled)
			get(key,function(err,data){
				if(err || !data || data==undefined)
					fetch_value_func(function(err,search_data){
						if(err)
							callback(err);
						else{
							set(key,search_data,lifetime,function(err,search_data1){});
							callback(null,search_data);
						}
					});
				else{
					logger.verbose("Cache HIT : "+key);
					callback(null,data);
				}
			});	
		else {
			fetch_value_func(callback);
		}
	}
}


global.Cache=exports.Cache=Cache;
