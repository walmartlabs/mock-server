var config = require('./config'),
    connect = require('connect'),
    gzippo;

try {
  gzippo = require('gzippo');
} catch (err) { /* NOP */ }

var staticImpl;

module.exports = function(req, res, next) {
  staticImpl(req, res, next);
};

module.exports.init = function() {
  var path = config.appDir + '/' + ((config.buildTarget || {}).path || 'build');
  console.error('set static path', path);

  staticImpl = gzippo ? gzippo.staticGzip(path) : connect.static(path);
};
config.on('reload', function() {
  module.exports.init();
});
config.on('build-target', function() {
  module.exports.init();
});
