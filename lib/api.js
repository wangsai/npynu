'use strict';

var fs = require('fs');
var _ = require('lodash');
var assert = require('assert');
var async = require('async');

var utils = require('./utils');
var pkg = require('../package.json');

//options: bucket, operator, password, endpoint
function UPYUN(options) {

    if(!(this instanceof UPYUN)) return new UPYUN(options);

    if(!options.bucket || !options.operator || !options.password) {
        assert('"bucket" or "operator" or "password" MUSTE be set!'); 
    }

    options = _.defaults(options, {
        endpoint : 'v0'
    });

    options.endpoint = utils.transEndpoint(options.endpoint);

    this._conf = options;
}


UPYUN.prototype.getUsage = function(callback) {
    var options = utils.genReqOpts(this, 'GET', '/?usage');
    utils.request(options, null, null, function(err, result) {
        if(err) {
            return callback(err);
        }
        callback(null, result);
    });
};

//[opts]: limit, order, iter
UPYUN.prototype._listDir = function(remotePath, opts, callback) {
    if(typeof arguments[arguments.length - 1] !== 'function') {
        throw new Error('No callback specified.');
    }

    callback = arguments[arguments.length - 1];

    opts = (opts !== callback) ? opts : {};

    var query = {};

    if(opts.limit)
        qurey['X-List-Limit'] = opts.limit;

    if(opts.order)
        query['X-List-Order'] = opts.order;

    if(opts.iter)
        query['X-List-Iter'] = opts.iter;

    var options = utils.genReqOpts(this, 'GET', remotePath, null, query);

    utils.request(options, null, null, function(err, result) {
        if(err) {
            return callback(err);
        }

        callback(null, result);  //return raw data
    });
};

//[order]: `desc`(default) or `asc`
UPYUN.prototype.listDir = function(remotePath, order, callback) {
    if(typeof arguments[arguments.length - 1] !== 'function') {
        throw new Error('No callback specified.');
    }

    callback = arguments[arguments.length - 1];

    if(order === callback)
        order = 'desc';
    else
        order = order || 'desc';

    var that = this;
    var response;
    var data = [];

    async.doUntil(
        function(cb){
            var iter = response && response.headers && response.headers['x-upyun-list-iter'];

            var options = {
                iter: iter,
                order: order
            };

            that._listDir(remotePath, options, function(err, res){
                if(err) return cb(err);

                data.push(res.data);
                response = res;
                cb(null);
            });
        },
        function(){
            return response.headers['x-upyun-list-iter'] === 'g2gCZAAEbmV4dGQAA2VvZg';
        },
        function(err){
            if(err) return callback(err);

            var res = response;
            res.data = data.join('\n');
            callback(err, res);
        }
    );
};

UPYUN.prototype.createDir = function(remotePath, callback) {
    var options = utils.genReqOpts(this, 'POST', remotePath, null, {folder: true});
    utils.request(options, null, null, function(err, result) {
        if (err) {
            return callback(err);
        }
        callback(null, result);
    });
};

UPYUN.prototype.removeDir = function(remotePath, callback) {
    var options = utils.genReqOpts(this, 'DELETE', remotePath);
    utils.request(options, null, null, function(err, result) {
        if (err) {
            return callback(err);
        }
        callback(null, result);
    });
};

UPYUN.prototype.browseFile = function(remotePath, callback) {
    var options = utils.genReqOpts(this, 'HEAD', remotePath);
    utils.request(options, null, null, function(err, result) {
        if(err) {
            return callback(err);
        }

        result = utils.parseRes(result);
        result.fileType = result.headers['x-upyun-file-type'];
        result.fileSize = result.headers['x-upyun-file-size'];
        result.fileCreateDate = result.headers['x-upyun-file-date'];

        callback(null, result);
    });
};

//[opts]: type(Content-Type), checksum(Content-MD5), secret(Content-Secret) and many extra image-related options
UPYUN.prototype.uploadFile = function(remotePath, localFile, opts, callback) {
    if(typeof arguments[arguments.length - 1] !== 'function') {
        throw new Error('No callback specified.');
    }
    callback = arguments[arguments.length - 1];
    var isFile = fs.existsSync(localFile);
    var _self = this;

    opts = opts !== callback ? opts : {};

    if(!isFile) throw new Error(localFile + ' not exists!');

    if(opts.type) {
        opts['Content-Type'] = opts.type;
        delete opts.type;
    }
        
    if(opts.checksum) {
        opts['Content-MD5'] = opts.checksum;
        delete opts.checksum;
    }

    if(opts.secret) {
        opts['Content-Secret'] = opts.secret;
        delete opts.secret;
    }

    var contentLength = fs.statSync(localFile).size;
    if(!opts.checksum) {
        utils.md5sumFile(localFile, function(err, result) {
                opts['Content-MD5'] = result;
                _upload(contentLength, opts);
            });
    }
    else {
        _upload(contentLength, opts);
    }

    function _upload(contentLength, opts) {
        var options = utils.genReqOpts(_self, 'PUT', remotePath, contentLength, opts);

        utils.request(options, localFile, null, function(err, result) {
            if(err) {
                return callback(err);
            }
            callback(null, result);
        });
    }
};

UPYUN.prototype.downloadFile = function(remotePath, localPath, callback) {
    callback = arguments[arguments.length - 1];
    localPath = arguments.length === 3 && (typeof localPath === 'string') ? localPath :  null;
    var options = utils.genReqOpts(this, 'GET', remotePath);

    utils.request(options, null, localPath, function(err, result) {
        if(err) {
            return callback(err);
        }
        callback(null, result);
    });
};

UPYUN.prototype.removeFile = function(remotePath, callback) {
    var options = utils.genReqOpts(this, 'DELETE', remotePath);

    utils.request(options, null, null, function(err, result) {
        if(err) {
            return callback(err);
        }
        callback(null, result);
    });
};

module.exports = exports.UPYUN = UPYUN;
