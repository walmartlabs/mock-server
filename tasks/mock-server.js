/*
  Grunt task, sample usage:

  grunt.loadNpmTasks('mock-server');

  grunt.initConfig({
    'mock-server': {
      standalone: true,
      appDir: '../public'
    }
  });

  grunt.registerTask('default', ['lumbar:build','mock-server']);
*/

module.exports = function(grunt) {
  grunt.registerMultiTask('mock-server', 'Starts a mock-server process', function() {

    var done = this.async();
    var config = require('../lib/config');
    var path = require('path');
    var options = this.data;


    // When true, the server proxies requests for assets it can't resolve locally
    config.isProxied = !!JSON.parse(options.proxied || false);

    config.isStandalone = !!JSON.parse(options.standalone || false);

    config.isHeroku = config.isStandalone;

    config.forever = !!JSON.parse(options.forever || false);

    config.liveReload = !!JSON.parse(options.liveReload || false);

    // When true, ensures that CORS headers are always set
    config.forceCors = !!JSON.parse(options.forceCors || false);

    // Directory that holds the root of the application you want to serve
    config.appDir = options.appDir ? path.resolve(options.appDir) : false;

    // When isProxied is true, this is the URL that the proxy resolves against
    config.proxyServer = options.proxyServer || process.env.DEFAULT_PROXY;

    // The HTTP port for the server.
    // Defaults to 8080
    config.port = parseInt(options.port || process.env.PORT || 8080);

    // The HTTP port for the server if you are behind a proxy.
    // Defaults to 8080
    config.forwardPort = parseInt(options.port || config.isStandalone ? 80 : config.port);

    // The HTTPS port for the server
    // Defaults to 8081
    config.securePort = parseInt(options.securePort || config.isStandalone ? 443 : 8081);

    if (!config.appDir) {
      throw grunt.util.error('"appDir" option required for mock-server task');
    }

    // start the server
    require('../lib');
  });
};
