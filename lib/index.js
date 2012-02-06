var admin = require('./admin'),
    config = require('./config'),
    cors = require('./cors'),
    express = require("express"),
    fs = require('fs'),
    mocks = require("../mocks"),
    path = require('path'),
    proxy = require('./proxy')
    staticShim = require('./static-shim'),
    liveReload = require('./live-reload');
    
mocks.init();

function resourceRewrite(req, res, next) {
  // Rewrite requests to /r/phoenix
  var match = /^\/r\/phoenix(.*)/.exec(req.url);
  if (match) {
    req.url = match[1];
  }
  next();
}

function configure(app, secure) {
  app.set('views', path.dirname(__dirname) + '/views/');
  app.set('view engine', 'jade');

  app.configure(function() {
    app.use(express.logger());
    app.use(express.methodOverride());
    app.use(resourceRewrite);
    app.use(mocks.provider);
    app.use(staticShim);
    app.use(app.router);
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });

  admin(app);

  app.all('/m/x', function(req, res, next) {
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

console.log('Starting phoenix proxy server on port', config.port);
var app = express.createServer();
configure(app, false);
app.listen(config.port);

if (!config.isHeroku) {
  console.log('Starting phoenix proxy server on secure port', config.securePort);
  try {
    var hostExists = fs.statSync(config.appDir + '/host.key').isFile();
  } catch (err) { /* NOP */ }

  var secureApp = express.createServer({
      key: fs.readFileSync((hostExists ? config.appDir + '/host.key' : path.dirname(__dirname) + '/local.key')),
      cert: fs.readFileSync((hostExists ? config.appDir + '/host.cert' : path.dirname(__dirname) + '/local.cert'))
    })
  configure(secureApp, true);
  secureApp.listen(config.securePort);
}

if (config.liveReload) {
  liveReload(app, secureApp);
}
