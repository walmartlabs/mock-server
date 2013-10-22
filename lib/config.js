var _ = require('underscore'),
    events = require('events'),
    fs = require('fs'),
    path = require('path');

var standalone = process.env.PHOENIX_API_HOST_STANDALONE;

// TODO : Move all of these env fields to arguments

var appDir,
    buildTarget,
    proxyServer;

// Simple object to keep state
exports = module.exports = _.extend({
  reloadProjectConfig: function() {
    this.projectConfig = {};
    try {
      var dirConfig = fs.readFileSync(appDir + '/mock-server.json', 'utf8');
      _.extend(this.projectConfig, JSON.parse(dirConfig));
      console.log('Loaded project config from', appDir + '/mock-server.json');
    } catch(err) {
      if (err.code !== 'ENOENT') {
        throw new Error('Failed to load project config ' + err);
      }
    }
    try {
      var dirConfig = fs.readFileSync(appDir + '/mock-server-local.json', 'utf8');
      _.extend(this.projectConfig, JSON.parse(dirConfig));
      console.log('Loaded project config from', appDir + '/mock-server-local.json');
    } catch(err) {
      if (err.code !== 'ENOENT') {
        throw new Error('Failed to load local project config ' + err);
      }
    }
    this.emit('reload');
  },

  set appDir(value) {
    appDir = path.resolve(value);
  },
  get appDir() {
    return appDir;
  },

  set buildTarget(i) {
    buildTarget = i;
    this.emit('build-target');
  },
  get buildTarget() {
    var buildTargets = this.projectConfig['build-targets'] || [],
        ret = buildTargets[buildTarget];
    if (!ret && exports.isHeroku) {
      // Default to production mode if running in Heroku
      ret = _.find(buildTargets, function(target) { return target.name === (process.env.DEFAULT_TARGET || 'Production'); });
    }
    return ret || buildTargets[0];
  },

  projectConfig: {},
  port: 8080,
  securePort: 8081,

  set proxyServer(value) {
    proxyServer = value;
  },
  get proxyServer() {
    if (!proxyServer) {
      return this.serverList[0];
    } else {
      return proxyServer;
    }
  },
  get serverList() {
    return _.map(this.projectConfig.servers, function(server) {
      return server.host || server;
    });
  },
  get serverConfig() {
    return _.find(this.projectConfig.servers, function(server) {
      return server.host === this.proxyServer;
    }, this) || {};
  },

  mocksEnabled: process.env.ENABLE_MOCKS,
  eatCookies: JSON.parse(process.env.PHOENIX_EAT_COOKIES || '{}'),

  standalone: standalone,
  proxyPort: standalone ? 8081 : 80,
  secureProxyPort: standalone ? 8083 : 443,

  liveReload: false,

  logTrace: process.env.PHOENIX_PROXY_TRACE,
  logTracePrefix: process.env.PHOENIX_PROXY_TRACE_PREFIX,

  toString: function() {
    return JSON.stringify(_.pick(this, 'buildTarget', 'port', 'securePort', 'proxyServer', 'serverConfig', 'eatCookies', 'isHeroku', 'isStandalone'), undefined, 2);
  }

  // Event Emitter must extend into this as extend doesn't work well with the getters
}, new events.EventEmitter());

if (module.exports.logTrace === "false") {
  module.exports.logTrace = false;
}
