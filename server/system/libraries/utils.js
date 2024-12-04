

exports.getDateFromTimeoffset = function (ts, timezone, format) {
  if (timezone == "" || timezone == false) timezone = "Asia/Kolkata";
  if (format == "" || format == false || format == undefined) format = "DD-MM-YYYY";
  var moment = require('moment-timezone');
  var dt = moment(ts * 1000).tz(timezone).format(format);
  return dt;
};

exports.getUTCTimeoffsetFromDate = function (date) {
  var moment = require('moment-timezone');
  var dt = moment(date).tz('UTC').format('x') / 1000;
  return dt;
};


exports.toUnderscore = function () {
  return this.replace(/([A-Z])/g, function ($1) {
    return "_" + $1.toLowerCase();
  });
};
exports.isValidEmail = function (val) {
  // false when validation fails
  //return (/^([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})$/i).test( val )
  if (val == "")
    return false;
  else
    return (/^[A-Z0-9._-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i).test(val)
  //return(/^\w+[\w-\.]*\@\w+((-\w+)|(\w*))\.[a-z]{2,3}$/i).test(val)
}
exports.isEmpty = function (val) {
  // not all passwords should be set, BUT when string, should be encoded
  if (typeof val === 'string') {
    if (val.length) { // when it comes empty, something went wrong!
      return true
    } else {
      return false
    }
  } else {
  }
}
exports.isISODateFormat = function (dat) {
  var date = new Date(dat);
  try {
    var iso_date = date.toISOString().split('.')[0] + 'Z';
    if (iso_date == dat)
      return true;
    else
      return false;
  } catch (e) {
    return false;
  }
}
exports.isNumber = function (n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
exports.getMonthInWords = function (month) {
  switch (month) {
    case 1:
      return "Jan";
    case 2:
      return "Feb";
    case 3:
      return "Mar";
    case 4:
      return "Apr";
    case 5:
      return "May";
    case 6:
      return "Jun";
    case 7:
      return "Jul";
    case 8:
      return "Aug";
    case 9:
      return "Sep";
    case 10:
      return "Oct";
    case 11:
      return "Nov";
    case 12:
      return "Dec";
    default:
      return "Jan";
  }
}
exports.isValidUSzipCode = function (val) {
  // false when validation fails
  return (/^[\d]{5}(-[\d]{4})?$/).test(val)
}

/*
Author: Chirag Shah
Created On: 19-Aug-2013

Method used for validate Phone Number
Input -> Phone number
Output -> Boolean
*/
/*exports.md5 = function (str) {
  var crypto = require("crypto");
  return crypto.createHash('md5').update(str).digest('hex');
}*/

exports.escape = function (str) {
  var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;',
    "'": '&apos;'
  };
  return String(str).replace(/[&<>"'\/]/g, function (s) {
    return entityMap[s];
  });
}
exports.unescape = function (str) {
  var entityMap = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": "<",
    '&quot;': "\"",
    '&#39;': "'",
    '&#x2F;': "/",
    '&apos;': "'",
    'lt;': "<",
    'gt;': ">"
  };
  return String(str).replace(/(&amp;|$lt;|lt;|gt;|&gt;|&quot;|&#39;|&#x2F;|&apos;)/g, function (s) {
    return entityMap[s];
  });
};

exports.encrypt = function (buffer, password) {
  var crypto = require('crypto');
  var algorithm = 'aes-256-ctr';
  var cipher = crypto.createCipher(algorithm, password);
  var crypted = Buffer.concat([cipher.update(buffer), cipher.final()]).toString('base64');
  return crypted;
};

exports.decrypt = function (buffer, password) {
  buffer = new Buffer(buffer, 'base64').toString('ascii');
  var crypto = require('crypto');
  var algorithm = 'aes-256-ctr';
  var decipher = crypto.createDecipher(algorithm, password);
  var dec = Buffer.concat([decipher.update(buffer), decipher.final()]).toString('ascii');
  return dec;
};
let lodash = require('lodash');

function convertKeysToCapitalize(body) {
  lodash.forEach(body, (val, key) => {
    if (typeof val === 'object' && !lodash.isArray(val)) {
      val = convertKeysToCapitalize(val);
    } else if (typeof val === 'object' && lodash.isArray(val)) {
      lodash.forEach(val, (arrayObject) => {
        if (typeof arrayObject === 'object') {
          arrayObject = convertKeysToCapitalize(arrayObject);
        }
      });
    }
    if (typeof body === 'object' && !lodash.isArray(body)) {
      body[lodash.capitalize(key)] = val;
      if (key[0] === key[0].toLowerCase()) {
        delete body[key];
      }
    }
  });
  return body;
};

exports.convertKeysToCapitalize = convertKeysToCapitalize;
