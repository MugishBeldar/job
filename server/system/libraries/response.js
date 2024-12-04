// function ResponseManager() {
// 	var that = this;
// 	this.handler = function () {
// 		return function (req, res, next) {
// 			var resp_handler = new ResponseHandler(req, res);
// 			resp_handler.start_time = (new Date()).getTime();
// 			res.sendResponse = resp_handler.sendResponse;
// 			res.sendError = resp_handler.sendError;
// 			return next();
// 		};
// 	}
// 	// this.authHandler = function (bypassedPaths, completelyByPassedPaths, genericPaths) {
// 	// 	return function (req, res, next) {
// 	// 		if (req.url == 'OPTIONS') {
// 	// 			next();
// 	// 			return;
// 	// 		}

// 	// 		var authAccessKey = req.headers.appaccesskey;
// 	// 		var authPrivateKey = req.headers.appprivatekey;
// 	// 		var sessionToken = req.headers.sessiontoken;

// 	// 		var hostname = req.hostname.replace('api.', '');
// 	// 		if (hostname === '127.0.0.1' || hostname == 'muditlocal.salesmate.io') {
// 	// 			hostname = 'newlocal.salesmate.io';
// 	// 		}

// 	// 		if(req.headers['x-linkname']){
// 	// 		    hostname=req.headers['x-linkname'];
// 	// 		}

// 	// 		if (hostname == global.genericDomain) {

// 	// 				let isGenericPath = __lodash.find(genericPaths, function (path) {
// 	// 					var regex = new RegExp(path, 'i');
// 	// 					return req.url.match(regex);
// 	// 				});
// 	// 				if (!isGenericPath) {
// 	// 					return res.sendError(new Exception('InvalidAuthRequest', 'Application Access Key missing'));
// 	// 				}
// 	// 				req.soulCRMHost = hostname;
// 	// 				return global.setupGenericModel()
// 	// 					.then((obj) => {
// 	// 						req.ORM = obj;
// 	// 						return next();
// 	// 					})
// 	// 					.catch((err) => {
// 	// 						if (err) {
// 	// 							res.sendError(err);
// 	// 							return;
// 	// 						}
// 	// 					});

// 	// 		}
// 	// 		req.soulCRMHost = hostname;
// 	// 		req.linkName = hostname;
// 	// 		req.hostname=hostname;
// 	// 		let isCompleteByPassedPath = __lodash.find(completelyByPassedPaths, function (path) {
// 	// 			var regex = new RegExp(path, 'i');
// 	// 			return req.url.match(regex);
// 	// 		});

// 	// 		if (isCompleteByPassedPath) { // When request is for path which don't require any user/app identification
// 	// 			global.SetupModel(hostname, function (err, obj) {
// 	// 				if (err) {
// 	// 					res.sendError(err);
// 	// 					return;
// 	// 				}
// 	// 				req.ORM = obj;
// 	// 				return next();
// 	// 			});
// 	// 		} else {
// 	// 			let isByPassedPath = __lodash.find(bypassedPaths, function (path) {
// 	// 				var regex = new RegExp(path, 'i');
// 	// 				return req.url.match(regex);
// 	// 			});

// 	// 			if (isByPassedPath) { //When request is for bypassed path, which requires only app authentication
// 	// 				// Verify Access Key & Secret Key is passed, because for bypassed path, app identification is must
// 	// 				if (authAccessKey === '' || authAccessKey === undefined) {
// 	// 					var exception = new Exception('InvalidAuthRequest', 'Application Access Key missing');
// 	// 					res.sendError(exception);
// 	// 					return;
// 	// 				}
// 	// 				if (authPrivateKey === '' || authPrivateKey === undefined) {
// 	// 					var exception = new Exception('InvalidAuthRequest', 'Application Secret Key missing');
// 	// 					res.sendError(exception);
// 	// 					return;
// 	// 				}
// 	// 				global.SetupModel(hostname, function (err, obj) {
// 	// 					if (err) {
// 	// 						res.sendError(err);
// 	// 						return;
// 	// 					} else {
// 	// 						req.ORM = obj;
// 	// 						obj._db.Application.find({
// 	// 							where: {
// 	// 								accessKey: authAccessKey,
// 	// 								privateKey: authPrivateKey
// 	// 							}
// 	// 						}).then(function (application) {
// 	// 							if (application) {
// 	// 								req.Application = application;
// 	// 								if (application.dataValues.allowedAPICalls !== 0 && application.dataValues.currentHourAPICallsCount > application.dataValues.allowedAPICalls) {
// 	// 									res.sendError(new Exception('APILimitReached', {
// 	// 										limit: application.dataValues.allowedAPICalls
// 	// 									}));
// 	// 									return;
// 	// 								}
// 	// 								//Get list of all the modules in System
// 	// 								GetModules(req)
// 	// 									.then(function (modules) {
// 	// 										req.Modules = modules;
// 	// 										updateApplicationAPIAccessCount(obj.sequelize, application.id);
// 	// 										next();
// 	// 									})
// 	// 									.catch((e) => {
// 	// 										res.sendError(e);
// 	// 									});
// 	// 							} else {
// 	// 								res.sendError(new Exception('InvalidAuthRequest', 'Invalid Access Key or Secret Key'));
// 	// 							}
// 	// 						});
// 	// 					}
// 	// 				});
// 	// 			} else { // When Request is for Path that requires users token
// 	// 				global.SetupModel(hostname, function (err, obj) {
// 	// 					if (err) {
// 	// 						res.sendError(err);
// 	// 						return;
// 	// 					} else {
// 	// 						req.ORM = obj;
// 	// 						obj._db.UserAccessToken.find({
// 	// 							where: {
// 	// 								token: sessionToken
// 	// 							},
// 	// 							include: [{
// 	// 								model: obj._db.User,
// 	// 								include: [obj._db.Role, obj._db.Profile]
// 	// 							}, obj._db.Application]
// 	// 						})
// 	// 							.then(function (usertoken) {
// 	// 								var error = null;
// 	// 								if (!usertoken) {
// 	// 									return res.sendError(new Exception('AuthorizationFailed', 'Invalid session token'));
// 	// 								}

// 	// 								let application = usertoken.Application;
// 	// 								if (application.dataValues.allowedAPICalls !== 0 && application.dataValues.currentHourAPICallsCount > application.dataValues.allowedAPICalls) {
// 	// 									res.sendError(new Exception('APILimitReached', {
// 	// 										limit: application.dataValues.allowedAPICalls
// 	// 									}));
// 	// 									return;
// 	// 								}
// 	// 								var time = Math.round((new Date()).getTime() / 1000, 0);
// 	// 								if (usertoken.getDataValue('updatedAt') + (application.dataValues.sessionTokenExpiryPeriod) >= time || application.dataValues.sessionTokenExpiryPeriod === 0) {
// 	// 									obj._db.UserAccessToken.update({
// 	// 										updatedAt: time
// 	// 									}, {
// 	// 										where: {
// 	// 											token: sessionToken
// 	// 										}
// 	// 									});
// 	// 									req.Application = application;
// 	// 									req.User = usertoken.User;
// 	// 									req.User.Profile.GetToken(); // Todo: Refactor to cache it
// 	// 									req.User.GetModulePermissions() // Todo: Refactor to cache it
// 	// 										.then(function (permissions) {
// 	// 											forwardRequest(req, res, next);
// 	// 										})
// 	// 										.catch((e) => {
// 	// 											console.error(e);
// 	// 											res.sendError('DBError', 'Error getting module permissions');
// 	// 										});

// 	// 								} else {
// 	// 									res.sendError(new Exception('SessionExpired'));
// 	// 								}

// 	// 							})
// 	// 							.catch((e) => {
// 	// 								console.error(e);
// 	// 								res.sendError('DBError', 'Error getting user token');
// 	// 							});
// 	// 					}
// 	// 				});
// 	// 			}
// 	// 		}
// 	// 	};
// 	// };
// }

// function updateApplicationAPIAccessCount(sequelize, id) {
// 	return;
// 	if (id == 2) { //Update API count for API calls only
// 		let query = `UPDATE applications set currentHourAPICallsCount=currentHourAPICallsCount+1, totalAPICallsCount=totalAPICallsCount+1 WHERE id=${id}`;
// 		sequelize.query(query);
// 	}
// }

// //Issue: SP-2716
// function forwardRequest(req, res, next) {
// 	global.cache.fetch(`${req.linkName}:modules-map-${req.User.id}`,7*24*3600,
// 		function(callback){
// 			console.log(req.url+' -- Cache miss');
// 			//Get list of all the modules in System
// 			GetModules(req)
// 				.then(function (modules) {
// 					//Get list of users that are below that user
// 					GetUsersBelowUser(req)
// 						.then(function (users) {
// 							var needToGetAllUsers = false;
// 							for (var key in modules) {
// 								if (modules[key].defaultAccess == 'Private') { // User can read/write records of himself or users below him
// 									modules[key].readRecordsOfUsers = users;
// 									modules[key].writeRecordsOfUsers = users;
// 								} else if (modules[key].defaultAccess == 'PublicRO') { // User can read records or all user and write records of himself or user below him
// 									modules[key].writeRecordsOfUsers = users;
// 									needToGetAllUsers = true;
// 								} else { // User can read/write records of all users
// 									needToGetAllUsers = true;
// 								}
// 							}

// 							if (needToGetAllUsers) {
// 								req.ORM._db.User.findAll({
// 									raw: true
// 								})
// 									.then(function (allUserObj) {
// 										var allUsers = [];
// 										for (key in allUserObj) {
// 											allUsers.push(allUserObj[key].id);
// 										}
// 										for (key in modules) {
// 											if (modules[key].defaultAccess == 'PublicRO') { // User can read records or all user and write records of himself or user below him
// 												modules[key].readRecordsOfUsers = allUsers;
// 											} else if (modules[key].defaultAccess == 'PublicRW') { // User can read/write records of all users
// 												modules[key].readRecordsOfUsers = allUsers;
// 												modules[key].writeRecordsOfUsers = allUsers;
// 											}
// 										}
// 										updateApplicationAPIAccessCount(req.ORM.sequelize, req.Application.id);
// 										return callback(null,modules);
// 									});
// 							} else {
// 								return callback(null,modules);
// 							}
// 						})
// 						.catch((e) => {
// 							return callback(e);
// 						});

// 				})
// 				.catch((e) => {
// 					return callback(e);
// 				});
// 		},
// 		function(err,modules){
// 			if(err){
// 				console.error(err);
// 				res.sendError(err);
// 				return;
// 			}
// 			req.Modules = modules;
// 			updateApplicationAPIAccessCount(req.ORM.sequelize, req.Application.id);
// 			next();
// 		});
// }

// function GetModules(req) {
// 	var deferred = Q.defer();
// 	req.ORM._db.Module.findAll({
// 		raw: true
// 	})
// 		.then(function (modules) {
// 			var final_modules = {};
// 			for (key in modules) {
// 				final_modules[modules[key]['name']] = modules[key];
// 			}
// 			deferred.resolve(final_modules);
// 		})
// 		.catch(function (error) {
// 			console.error(error);
// 			deferred.reject(new Exception('DBError', 'Error getting modules'));
// 		});
// 	return deferred.promise;
// }

// function GetUsersBelowUser(req) {
// 	var deferred = Q.defer();
// 	req.ORM._db.Role.findAll({
// 		raw: true
// 	})
// 		.then(function (roles) {
// 			var reporting_roles = getRolesUnderRole(req.User.Role.id, roles);
// 			var reportingUsers = [];
// 			reportingUsers.push(req.User.id);
// 			if (req.User.Role.allowPeerDataSharing == true) {
// 				reporting_roles.push(req.User.Role.id);
// 			}

// 			if (reporting_roles.length > 0) {
// 				req.ORM._db.User.findAll({
// 					where: {
// 						roleId: {
// 							$in: reporting_roles
// 						}
// 					},
// 					raw: true
// 				})
// 					.then(function (users) {
// 						for (var key in users) {
// 							if (users[key].id == req.User.id) {
// 								continue;
// 							}
// 							reportingUsers.push(users[key].id);
// 						}
// 						deferred.resolve(reportingUsers);
// 					});
// 			} else {
// 				deferred.resolve(reportingUsers);
// 			}
// 		})
// 		.catch(function (error) {
// 			console.error(error);
// 			deferred.reject(new Exception('DBError', 'Error getting roles'));
// 		});
// 	return deferred.promise;
// }

// function getRolesUnderRole(role_id, roles) {
// 	var reporting_roles = [];
// 	for (key in roles) {
// 		if (roles[key].reportsTo == role_id) {
// 			reporting_roles.push(roles[key].id);
// 			reporting_roles = reporting_roles.concat(getRolesUnderRole(roles[key].id, roles));
// 		}
// 	}
// 	return reporting_roles;
// }

// exports.ResponseManager = ResponseManager;

// function ResponseHandler(req, resp) {
// 	var response = resp;
// 	var request = req;
// 	this.start_time = 0;
// 	this.response_time = 0;
// 	this.path = '';
// 	this.input_parameters = {};
// 	this.application_user = '';
// 	this.user = '';
// 	var that = this;
// 	this.sendResponse = function (resp, not_send_no_records) {
// 		if (Object.keys(resp).length > 0 || not_send_no_records) {
// 			//var str = Utils.unescape(JSON.stringify(resp));
// 			//str = str.replace(/&<[^>]*>/g, ' ');
// 			//str = str.replace(/  /g,'');
// 			//resp = JSON.parse(str);
// 			response.send({
// 				Status: 'success',
// 				Data: resp
// 			});
// 		} else {
// 			response.send({
// 				Status: 'success',
// 				Data: resp,
// 				Message: 'No records found'
// 			});
// 		}

// 		// that.response_time=(new Date()).getTime()-that.start_time;
// 		// that.path=request.route.path;

// 		// for(key in request.params){
// 		// 	that.input_parameters[key]=request.params[key];
// 		// }
// 		// for(key in request.query){
// 		// 	that.input_parameters[key]=request.query[key];
// 		// }
// 		// for(key in request.body){
// 		// 	that.input_parameters[key]=request.body[key];
// 		// }

// 		// if(req.user)
// 		// 	that.application_user=req.user.id;
// 		// else
// 		// 	that.application_user=0;

// 		// if(request.params.email)
// 		// 	that.user=request.params.email;
// 		// else if (request.query.email)
// 		// 	that.user=request.query.email;
// 		// else if (request.query.Email)
// 		// 	that.user=request.query.Email;
// 		// else if (request.body.email)
// 		// 	that.user=request.body.email;
// 		// else if (request.body.Email)
// 		// 	that.user=request.body.Email;

// 		// var log = that.getAccessLog();
// 		// var access_log = new AccessLog();
// 		// access_log.set('api', log.api);
// 		// access_log.set('start_time', log.start_time);
// 		// access_log.set('response_time', log.response_time);
// 		// access_log.set('input_parameters', log.input_parameters);
// 		// access_log.set('application_user', log.application_user);
// 		// access_log.set('user', log.user);
// 		// access_log.set('type','success');
// 		// access_log.set('output',resp);
// 		// access_log.set('method',request.route.method);
// 		// access_log.save(function(err, ac) {
// 		// 			if(that.user!='' && that.user!=undefined){
// 		// 		var user_tracking=new UserTracking();
// 		// 		user_tracking.trackUser(that.user,log.api,log.start_time,log.application_user,ac._id,that.isSecureLogin);
// 		// 	} 
// 		// 		});
// 	}
// 	// this.getAccessLog=function(){
// 	// 	return {
// 	// 		api:that.path,
// 	// 		start_time:that.start_time,
// 	// 		response_time:that.response_time,
// 	// 		input_parameters:that.input_parameters,
// 	// 		application_user: that.application_user,
// 	// 		user:that.user
// 	// 	};
// 	// }
// 	this.sendError = function (e) {
// 		var err;
// 		if (e.http_code)
// 			response.status(e.http_code);
// 		else
// 			response.status(400);

// 		if (e instanceof Exception) {
// 			err = e.getError();
// 		} else err = e;
// 		response.json({
// 			Status: 'failure',
// 			Error: err
// 		});

// 		// if(request.route){
// 		// 	that.response_time=(new Date()).getTime()-that.start_time;
// 		// 	if(request.route)
// 		// 		that.path=request.route.path;
// 		// 	else that.path='NA';

// 		// 	for(key in request.params){
// 		// 		that.input_parameters[key]=request.params[key];
// 		// 	}
// 		// 	for(key in request.query){
// 		// 		that.input_parameters[key]=request.query[key];
// 		// 	}
// 		// 	for(key in request.body){
// 		// 		that.input_parameters[key]=request.body[key];
// 		// 	}
// 		// 	if(req.user)
// 		// 	that.application_user=req.user.id;
// 		// 	else that.application_user=0;

// 		// 	if(request.params && request.params.email)
// 		// 		that.user=request.params.email;
// 		// 	else if (request.query && request.query.email)
// 		// 		that.user=request.query.email;
// 		// 	else if (request.query && request.query.Email)
// 		// 		that.user=request.query.Email;
// 		// 	else if (request.body && request.body.email)
// 		// 		that.user=request.body.email;
// 		// 	else if (request.body && request.body.Email)
// 		// 		that.user=request.body.Email;
// 		// 	else that.user='';

// 		// 	// console.log(that.getAccessLog());
// 		// 	if(req.query)
// 		// 		that.isSecureLogin=req.query.___isSecureLogin___==true?true:false;
// 		// 	else that.isSecureLogin=false;


// 		// 	var log = that.getAccessLog();
// 		// 	var access_log = new AccessLog();
// 		// 	access_log.set('api', log.api);
// 		// 	access_log.set('start_time', log.start_time);
// 		// 	access_log.set('response_time', log.response_time);
// 		// 	access_log.set('input_parameters', log.input_parameters);
// 		// 	access_log.set('application_user', log.application_user);
// 		// 	access_log.set('user', log.user);
// 		// 	access_log.set('type','error');
// 		// 	access_log.set('output',err);
// 		// 	access_log.set('method',request.route.method);
// 		// 	access_log.save(function(err, ac) {

// 		//  		});
// 		// }
// 	}
// }
