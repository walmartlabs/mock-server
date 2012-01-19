var admin = require('./admin'),
    config = require('./config'),
    cors = require('./cors'),
    express = require("express"),
    fs = require('fs'),
    mocks = require("../mocks"),
    path = require('path'),
    proxy = require('./proxy')
    staticShim = require('./static-shim');

try {
  var hostExists = fs.statSync(config.appDir + '/host.key').isFile();
} catch (err) { /* NOP */ }

var app = express.createServer(),
    secureApp = express.createServer({
      key: fs.readFileSync((hostExists ? config.appDir + '/host.key' : path.dirname(__dirname) + '/local.key')),
      cert: fs.readFileSync((hostExists ? config.appDir + '/host.cert' : path.dirname(__dirname) + '/local.cert'))
    });

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
    app.use(express.bodyParser());
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

configure(app, false);
configure(secureApp, true);

console.log("Starting phoenix proxy server on port", config.port, "and secure proxy on port", config.securePort, "proxying to", config.proxyServer);
app.listen(config.port);
secureApp.listen(config.securePort);
