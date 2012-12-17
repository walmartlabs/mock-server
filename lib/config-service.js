var _ = require('underscore'),
    config = require('./config');

module.exports = function(app, repo) {
  app.get('/config', function(req, res, next) {
    var serverConfig = config.serverConfig.config;

    var portConfig = {
      port: config.port,
      securePort: config.securePort
    };

    res.json(_.extend(portConfig, serverConfig));
  });
};
