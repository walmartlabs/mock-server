var _ = require('underscore'),
    events = require('events'),
    fs = require('fs'),
    path = require('path');

var standalone = process.env.PHOENIX_API_HOST_STANDALONE;

// TODO : Move all of these env fields to arguments

var appDir,
    buildTarget;

// Simple object to keep state
exports = module.exports = _.extend({
  reloadProjectConfig: function() {
    this.projectConfig = {};
    try {
      var dirConfig = fs.readFileSync(appDir + '/mock-server.json', 'utf8');
      _.extend(this.projectConfig, JSON.parse(dirConfig));
      console.log('Loaded project config from', appDir + '/mock-server.json');
    } catch(err) {
      /* NOP */
    }
    try {
      var dirConfig = fs.readFileSync(appDir + '/mock-server-local.json', 'utf8');
      _.extend(this.projectConfig, JSON.parse(dirConfig));
      console.log('Loaded project config from', appDir + '/mock-server-local.json');
    } catch(err) {
      /* NOP */
    }
    this.emit('reload');
  },

  set appDir(value) {
    appDir = value;
  },
  get appDir() {
    return appDir;
  },

  set buildTarget(i) {
    buildTarget = i;
  },
  get buildTarget() {
    var buildTargets = this.projectConfig['build-targets'] || [],
        ret = buildTargets[buildTarget];
    if (!ret && exports.isHeroku) {
      // Default to production mode if running in Heroku
      ret = _.find(buildTargets, function(target) { return target.name === 'Production'; });
    }
    return ret || buildTargets[0];
  },

  projectConfig: {},
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

  // Event Emitter must extend into this as extend doesn't work well with the getters
}, new events.EventEmitter());

if (module.exports.logTrace === "false") module.exports.logTrace = false;
