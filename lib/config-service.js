var _ = require('underscore'),
    config = require('./config'),
    url = require('url');

module.exports = function(req, res, next) {
  var path = url.parse(req.url).pathname;

  if (path !== (config.projectConfig.configUrl || '/config')) {
    return next();
  }

  var serverConfig = config.serverConfig.config;

  var portConfig = {
    port: config.isStandalone ? 80 : config.port,
    securePort: config.isStandalone ? 443 : config.securePort
  };

  res.json(_.extend(portConfig, serverConfig));
};
