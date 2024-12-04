Validator.isArray=function(obj){
	return util.isArray(obj);
}
Validator.isObject=function(obj){
	return typeof obj=="object";
}
Validator.isBoolean=function(obj){
	return (obj=="false" || obj===false || obj=="0" || obj==0 || obj=="true" || obj=="1" || obj==1 || obj===true);
}
Validator.isEmpty=function(obj){
	return (obj=="" || obj==undefined || obj==null || obj=="null");
}