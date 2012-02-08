var config = require('../lib/config'),
    cors = require('../lib/cors'),
    fs = require('fs');

var paths = [],
    len = 0;

exports.init = function() {
  if (config.mocksEnabled) {
    console.log("Mock server enabled");
  }

  config.on('reload', function() {
    paths = [];

    if (config.projectConfig.mocks) {
      var pathSource = require(config.appDir + '/' + config.projectConfig.mocks);

      for (var name in pathSource) {
        paths.push({
          regex: new RegExp(name),
          source: pathSource[name]
        });
      }
    }

    len = paths.length;
  });
};

exports.middleware = function(req, res, next) {
  if (config.mocksEnabled) {
    for (var i = 0; i < len; i++) {
      var path = paths[i];
      if (path.regex.test(req.url)) {
        console.log('Mocking url', req.url, 'to', (typeof path.source !== 'function' ? 'file' + path.source : 'callback'));
        cors.applyFullCORS(req.headers.host, req, res);

        if (req.method !== 'HEAD') {
          req.method = 'GET';   // The static provider which this eventually uses does not like the options command, which breaks the mocking
        }
        if (typeof path.source === 'function') {
          res.send(path.source.apply(path.source, Array.prototype.slice.call(req.url.match(path.regex), 1)));
        } else {
          res.sendfile(__dirname + '/' + path.source);
        }

        return;
      }
    }
  }

  next();
};
