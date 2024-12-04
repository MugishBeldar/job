/*
Author: Dipesh Patel
Created On: 14-Aug-2013

This is the Exception class, used to raise the exception, it also logs the exception.
*/

let fs=require('fs');
let util=require('util');
let EXCEPTION_MESSAGES=JSON.parse(fs.readFileSync(ROOT_PATH+DS+'config'+DS+'exceptions.js'));
function Exception(errorName,params,rootError){
    Error.captureStackTrace(this,Exception);
    this.errorName=errorName;
    this.params=params;
    // console.log('Error name: ', errorName);
    // if(errorName == 'FatalError'){
    // 	this.code = EXCEPTION_MESSAGES[errorName][params]['code'];
    // 	this.http_code=EXCEPTION_MESSAGES[errorName][params]['http_code'];
    // 	this.error_message = EXCEPTION_MESSAGES[errorName][params]['message'];
    // 	this.stack_trace=this.stack;
    // 	if(rootError!=undefined) this.rootError=rootError;
    // 	if(EXCEPTION_MESSAGES[errorName][params]['send_notification']=='true' || EXCEPTION_MESSAGES[errorName][params]['send_notification']==true)
    // 		logger.error(this);
    // }
    // else{
    this.code=EXCEPTION_MESSAGES[errorName]['code'];

    this.http_code=EXCEPTION_MESSAGES[errorName]['http_code'];
    this.error_message=EXCEPTION_MESSAGES[errorName]['Message'];

    if(params !=undefined && params!=null && typeof params!='string'){
        for(key in params){
            var regExp = new RegExp('{'+key+'}','g');
            this.error_message=this.error_message.replace(regExp,params[key]);
        }
    }else if(params!=undefined){
        this.error_message=params;
    }
    this.stack_trace=this.stack;
    if(rootError!=undefined) this.root_error=rootError;
    if(EXCEPTION_MESSAGES[errorName]['send_notification']=='true' || EXCEPTION_MESSAGES[errorName]['send_notification']==true)
        logger.error(this);
    // }

    this.getError=function(){
        return {
            'Code':this.code,
            'Name': this.errorName,
            'Message':this.error_message
        };
    }
}
util.inherits(Exception, Error);
global.Exception=exports.Exception =Exception;
