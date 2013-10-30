var _ = require('underscore'),
    config = require('./config'),
    cors = require('./cors'),
    url = require('url');

module.exports = function(req, res, next) {
  var path = url.parse(req.url).pathname;

  if (path !== (config.projectConfig.configUrl || '/config')) {
    return next();
  }

  var serverConfig = config.serverConfig.config;

  var portConfig = {
    port: config.isProxied ? 80 : config.port,
    securePort: config.isProxied ? 443 : config.securePort
  };

  cors.applyFullCORS(req.headers.host, req, res);
  res.json(_.extend(portConfig, serverConfig, config.localConfig));
};
