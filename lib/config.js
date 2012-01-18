var fs = require('fs'),
    path = require('path');

var standalone = process.env.PHOENIX_API_HOST_STANDALONE;

// TODO : Move all of these env fields to arguments

var appDir;

function findProjectDir() {
  var parent = appDir;
  while (path.dirname(parent) != parent) {
    parent = path.dirname(parent);
    try {
      fs.statSync(parent + '/.git');
      return parent;
    } catch(err) {
      /* NOP **/
    }
  }
}

// Simple object to keep state
module.exports = {
  set appDir(value) {
    appDir = value;
    this.projectDir = findProjectDir() || appDir;

    try {
      var dirConfig = fs.readFileSync(this.projectDir + '/mock-server.json', 'utf8');
      this.dirConfig = JSON.parse(dirConfig);
      console.log('Loaded project config from', this.projectDir + '/mock-server.json');
    } catch(err) {
      /* NOP */
    }
  },
  get appDir() {
    return appDir;
  },

  port: 8080,
  securePort: 8081,

  proxyServer: '',

  mocksEnabled: process.env.ENABLE_MOCKS,
  eatCookies: process.env.PHOENIX_EAT_COOKIES,

  standalone: standalone,
  proxyPort: standalone ? 8081 : 80,
  secureProxyPort: standalone ? 8083 : 443,

  logTrace: process.env.PHOENIX_PROXY_TRACE,
  logTracePrefix: process.env.PHOENIX_PROXY_TRACE_PREFIX
};

if (module.exports.logTrace === "false") module.exports.logTrace = false;
