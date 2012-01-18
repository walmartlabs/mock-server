var config = require('../lib/config'),
    cors = require('../lib/cors'),
    fs = require('fs');

var paths = [],
    len = 0;

exports.init = function() {
    if (config.mocksEnabled) {
        console.log("Mock server enabled");

        var pathSource = require('./paths');

        for (var name in pathSource) {
            paths.push({
                regex: new RegExp(name),
                source: pathSource[name]
            });
        }

        len = paths.length;
    }
};

exports.provider = function(req, res, next) {
    if (config.mocksEnabled) {
        var replaceUrl = req.url.replace(/\?username=mobile&password=1111&/, '?');
        for (var i = 0; i < len; i++) {
            var path = paths[i];
            if (path.regex.test(replaceUrl)) {
                console.log('Mocking url', req.url, 'to', (typeof path.source !== 'function' ? 'file' + path.source : 'callback'));
                cors.applyCORS(req, res);

                if (req.method !== 'HEAD') {
                  req.method = 'GET';   // The static provider which this eventually uses does not like the options command, which breaks the mocking
                }
                if (typeof path.source === 'function') {
                  res.send(path.source.apply(path.source, Array.prototype.slice.call(replaceUrl.match(path.regex), 1)));
                } else {
                  res.sendfile(__dirname + '/' + path.source);
                }

                return;
            }
        }
    }

    next();
};
