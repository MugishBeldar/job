let https = require('https');
let http = require('http');

let q = require('q');

// For the method post, pass content-type as per your need.

function request(tmpUrl, tmpOptions, tmpCallback){
    let options = {rejectUnauthorized:false, requestCert:true},callback,returnPromise=true;
    options.path = '/';

    if(typeof(tmpUrl) ==='string'){ // First Argument is URL

        if(tmpOptions.headers && Object.keys(tmpOptions.headers).length !== 0 && tmpOptions.headers.constructor === Object) {
            options.headers = tmpOptions.headers;
        }

        if(tmpUrl.body && Object.keys(tmpOptions.body).length !== 0 && tmpOptions.body.constructor === Object){
            options.body = tmpOptions.body;
            options.isJSON = tmpOptions.json;
        }
        options.method = tmpOptions.method;
        let breakUrl = tmpUrl.split('/');

        let qs = tmpOptions.qs;
        let query;

        if(breakUrl[0] === 'https:' || breakUrl[0] === 'http:'){
            options.protocol = breakUrl[0];
            options.host = breakUrl[2].split(':')[0];

            if(breakUrl[2].split(':')[1]){
                options.port = breakUrl[2].split(':')[1];
            }

            let removed = breakUrl.splice(0, 3);

        } else {
            options.host = breakUrl[0].split(':')[0];

            if(breakUrl[0].split(':')[1]){
                options.port = breakUrl[0].split(':')[1];
            }

            let removed = breakUrl.splice(0, 1);

        }

        if(Object.keys(qs).length !== 0 && qs.constructor === Object) {
            query = '?';
            query = query + Object.keys(qs).map(key => key + '=' + qs[key]).join('&');
            options.path = options.path + breakUrl.join('/') + query;
        } else {
            options.path = options.path + breakUrl.join('/');
        }


        if(typeof(tmpCallback)==='function'){ // Callback is given
            callback = tmpCallback;
            returnPromise=false;
        }

    } else{    // First Argument is options object that have all information including url.

        if(tmpUrl.headers && Object.keys(tmpUrl.headers).length !== 0 && tmpUrl.headers.constructor === Object) {
            options.headers = tmpUrl.headers;
        }

        if(tmpUrl.body && Object.keys(tmpUrl.body).length !== 0 && tmpUrl.body.constructor === Object){
            options.body = tmpUrl.body;
            options.isJSON = tmpUrl.json;
        }

        options.method = tmpUrl.method;
        let breakUrl = tmpUrl.url.split('/');

        let qs = tmpUrl.qs;
        let query;

        if(breakUrl[0] === 'https:' || breakUrl[0] === 'http:'){
            options.protocol = breakUrl[0];
            options.host = breakUrl[2].split(':')[0];

            if(breakUrl[2].split(':')[1]){
                options.port = breakUrl[2].split(':')[1];
            }

            let removed = breakUrl.splice(0, 3);

        } else {
            options.host = breakUrl[0].split(':')[0];

            if(breakUrl[0].split(':')[1]){
                options.port = breakUrl[0].split(':')[1];
            }

            let removed = breakUrl.splice(0, 1);
        }

        if(qs && Object.keys(qs).length !== 0 && qs.constructor === Object) {
            query = '?' + Object.keys(qs).map(key => key + '=' + qs[key]).join('&');
            options.path = options.path + breakUrl.join('/') + query;
        } else {
            options.path = options.path + breakUrl.join('/');
        }

        if(typeof(tmpOptions)==='function'){ // Callback is given
            callback = tmpOptions;
            returnPromise=false;
        }
    }

    let deferred=q.defer();

	let req;

	let resposeHandler = (res) => {
		let response= '';
		res.on('data', (data) => {
			response += data;
		});
		res.on('end',() => {
            try{
                response = typeof response==='string'?JSON.parse(response):response;
            } catch(err){
                response = response;
            }
            if(returnPromise){
				let promiseResponse = {
					response: res,
					responseBody: response
				};
				deferred.resolve(promiseResponse);
			}else{
				res.body = response;
				callback(null, res, response);
			}
		});
	};

	if(options.protocol && options.protocol == 'https:'){
		req = https.request(options, resposeHandler);
	} else {
		req = http.request(options, resposeHandler);
	}
    req.on('error', (error) => {
        if(returnPromise){
            deferred.reject(error);
        }else{
            callback(error);
        }
    });
    if(options.isJSON){
	    options.body = JSON.stringify(options.body)
        req.write(options.body);
    } else {
        if(options.body){
            req.write(options.body);
        }
    }
    req.end();
    if(returnPromise){
        return deferred.promise;
    }
}

module.exports = request;
