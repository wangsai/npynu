'use strict';

var upyun = require('./lib/api.js');

module.exports = exports.UPYUN = function(bucket, operator, password, endpoint) {

    return new upyun(bucket, operator, password, endpoint);
};
