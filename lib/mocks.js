var config = require('../lib/config'),
    cors = require('../lib/cors'),
    _ = require('underscore'),
    url = require('url'),
    fs = require('fs');

var pathDir = '',
    mockDir = config.appDir + '/' + config.projectConfig.mocks,
    routes = [];

function Route(path, source) {
  this.path = path;
  this.regex = new RegExp(path);
  this.source = source;
};

function matchPath(path) {
  var retval,
      route;

  for (var i = 0, l = routes.length; i < l; i++) {
    route = routes[i];

    if (route.regex.test(path)) {
      retval = route;
      break;
    }
  }

  return retval;
}

exports.init = function() {
  if (config.mocksEnabled) {
    console.log('Mock server enabled!!');
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
          routes.push(new Route(name, pathSource[name]));
        }
      }
    }
  });
};

exports.middleware = function(req, res, next) {
  var passedRoute = req.url,
      matchedRoute;

  if (!config.mocksEnabled) {
    return next();
  }

  if (passedRoute === '') {
    return next();
  }

  matchedRoute = matchPath(passedRoute, true);
  if (matchedRoute) {
    console.log('Mocking URL: ' + passedRoute);
    cors.applyFullCORS(req.headers.host, req, res);

    if (req.method !== 'HEAD') {
      req.method = 'GET';   // The static provider which this eventually uses does not like the options command, which breaks the mocking
    }

    if (_.isFunction(matchedRoute.source)) {
      var args = _.toArray(passedRoute.match(matchedRoute.regex).slice(1));
      args.push({
        params: _.clone(url.parse(passedRoute, true).query),
        body: _.clone(req.body),
        referrer: req.get('Referrer') || '/'
      });
      res.send(matchedRoute.source.apply(matchedRoute.source, args));
    } else {
      res.sendfile((pathDir || mockDir) + '/' + matchedRoute.source);
    }
    return true;
  }

  next();
};

