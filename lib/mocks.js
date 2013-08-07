var _ = require('underscore'),
    bodyParser = require('connect').bodyParser(),
    config = require('../lib/config'),
    cors = require('../lib/cors'),
    fs = require('fs'),
    url = require('url');

var pathDir = '',
    routes = [],
    len = 0;

function matchPath(path) {
  var route;

  for (var i = 0, l = len; i < l; i++) {
    route = routes[i];

    if (route.regex.test(path)) {
      return route;
    }
  }
}

exports.init = function() {
  if (config.mocksEnabled) {
    console.log("Mock server enabled");
  }

  config.on('reload', function() {
    routes = [];
    pathDir = '';

    if (config.projectConfig.mocks) {
      var pathSource = require(config.appDir + '/' + config.projectConfig.mocks);

      for (var name in pathSource) {
        if (name === '__dirname') {
          pathDir = pathSource[name];
        } else {
          routes.push({
            regex: new RegExp(name),
            source: pathSource[name]
          });
        }
      }
    }

    len = routes.length;
  });
};

exports.middleware = function(req, res, next) {
  var passedRoute = req.url,
      matchedRoute;

  if (!config.mocksEnabled) {
    return next();
  }

  matchedRoute = matchPath(passedRoute);
  if (matchedRoute) {
    console.log('Mocking URL: ' + passedRoute);
    cors.applyFullCORS(req.headers.host, req, res);

    bodyParser(req, res, function() {
      if (req.method !== 'HEAD') {
        req.method = 'GET';   // The static provider which this eventually uses does not like the options command, which breaks the mocking
      }

      if (_.isFunction(matchedRoute.source)) {
        var args = _.toArray(passedRoute.match(matchedRoute.regex).slice(1));
        args.push({
          params: url.parse(passedRoute, true).query,
          body: req.body,
          res: res,
          req: req
        });
        res.send(matchedRoute.source.apply(matchedRoute.source, args));
      } else {
        var dir = pathDir || (config.appDir + '/' + config.projectConfig.mocks);
        res.sendfile(dir + '/' + matchedRoute.source);
      }
    });
    return true;
  }

  next();
};

