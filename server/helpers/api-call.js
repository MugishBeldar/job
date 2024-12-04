'use strict';
const deferred = require('q').defer();
const request = require('request');
function sendAPIRequest(method,url,queryParams,body, headers, auth, formData){
	let environment = process.env.NODE_ENV;
	let params = {
		method:method,
		qs:queryParams,
		body:body,
		json:(body !== undefined && body !== null),
		headers: headers ? headers : '',
	};

	if(auth){
		params.auth = auth;
	}
	if(formData){
		params.form = formData;
		params["content-type"] = "application/x-www-form-urlencoded";
	}

	if (environment === '' || environment === undefined) {
		params.rejectUnauthorized = false;
		params.requestCert = true;
	}

	request(url,params,function(error,response,responseBody){
		if(error || (response && response.statusCode >= 400)){
			deferred.reject(error || response.body.Error || response.body);
		} else{
			try {
				if (typeof responseBody === 'string') {
					responseBody = JSON.parse(responseBody);
				}
				deferred.resolve(responseBody);
			} catch(e) {
				deferred.reject({status:response.statusCode, message:response.body});
			}
		}
	});
	return deferred.promise;
}

module.exports.sendAPIRequest = sendAPIRequest;