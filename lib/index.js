var admin = require('./admin'),
    buildBlocker = require('./build-blocker'),
    config = require('./config'),
    configService = require('./config-service.js'),
    express = require("express"),
    fs = require('fs'),
    mocks = require('./mocks'),
    path = require('path'),
    proxy = require('./proxy'),
    staticShim = require('./static-shim'),
    liveReload = require('./live-reload');

mocks.init();

function resourceRewrite(req, res, next) {
  // Rewrite requests to /r/phoenix
  var match = /^\/r\/phoenix(-v[\d]?)?(.*)/.exec(req.url);
  if (match) {
    req.url = match[2];
  }
  next();
}

function configure(app, secure) {
  app.set('views', path.dirname(__dirname) + '/views/');
  app.set('view engine', 'jade');

  app.configure(function() {
    app.use(express.logger());
    app.use(express.methodOverride());
    app.use(buildBlocker.middleware);
    app.use(configService);
    app.use(resourceRewrite);
    app.use(mocks.middleware);
    app.use(staticShim);
    app.use(app.router);
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });

  admin(app, repo);

  app.all('/m/x', function(req, res) {
    var data = '';
    req.on('data', function(chunk) {
      data += chunk;
    });
    req.on('end', function() {
      console.log('client:', data);
      res.send(200);
    });
  });

  app.all(/\/.*/, proxy.proxy(secure));
}

// Repo setup
var repo = require('./git-repo')(config.appDir, process.env.MOCK_REPO);
buildBlocker.init(repo);
repo.init(function() {
  if (config.isStandalone) {
    var watcher = require('./watcher')();
    watcher.init(repo);

    repo.build(function(){});
  }
});

console.log('Starting mock-server on port', config.port);
console.log('Config', config.toString());
var app = express.createServer();
configure(app, false);
app.listen(config.port);

if (!config.isHeroku) {
  console.log('Starting mock-server on secure port', config.securePort);
  try {
    var hostExists = fs.statSync(config.appDir + '/host.key').isFile();
  } catch (err) { /* NOP */ }

  var secureApp = express.createServer({
      key: fs.readFileSync((hostExists ? config.appDir + '/host.key' : path.dirname(__dirname) + '/local.key')),
      cert: fs.readFileSync((hostExists ? config.appDir + '/host.cert' : path.dirname(__dirname) + '/local.cert'))
    });
  configure(secureApp, true);
  secureApp.listen(config.securePort);
}

if (config.liveReload) {
  liveReload(app, secureApp);
}
