var _ = require('underscore'),
    config = require('./config');

module.exports = function(app) {
  app.get('/config', function(req, res) {
    var serverConfig = config.serverConfig.config;

    var portConfig = {
      port: config.isHeroku ? 80 : config.port,
      securePort: config.isHeroku ? 443 : config.securePort
    };

    res.json(_.extend(portConfig, serverConfig));
  });
};
