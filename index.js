#!/usr/bin/env node

var connect = require("connect"),
    cors = require('./cors'),
    express = require("express"),
    fs = require('fs'),
    gzippo,
    mocks = require("./mocks"),
    proxy = require('./proxy');

try {
  gzippo = require('gzippo');
} catch (err) { /* NOP */ }

try {
  var hostExists = fs.statSync(__dirname + '/host.key').isFile();
} catch (err) { /* NOP */ }

var app = express.createServer(),
    secureApp = express.createServer({
      key: fs.readFileSync(__dirname + (hostExists ? '/host.key' : '/local.key')),
      cert: fs.readFileSync(__dirname + (hostExists ? '/host.cert' : '/local.cert'))
    }),
    port = process.env.PHOENIX_PORT || 8080,
    securePort = process.env.PHOENIX_SECURE_PORT || 8081;

mocks.init();

function resourceRewrite(req, res, next) {
  // Rewrite requests to /r/phoenix
  var match = /^\/r\/phoenix(.*)/.exec(req.url);
  if (match) {
    req.url = match[1];
  }
  next();
}

app.configure(function(){
    app.use(express.logger());
    app.use(resourceRewrite);
    app.use(mocks.provider);
    app.use(gzippo ? gzippo.staticGzip('build/dev') : connect.static('build/dev'));
    app.use(app.router);
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.all('/m/j', proxy.proxy(true));

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

// Anything that is not proxy or static is treated like the index file (to allow refresh on pushState URLs)
app.get(/\/r\/.*/, function(req, res, next) {
  proxy.proxy(false)(req, res);
});
app.all(/\/_wicket\/.*/, function(req, res, next) {
  proxy.proxy(false)(req, res);
});
app.get(/\/android\/.*/, function(req, res, next) {
  res.sendfile('build/dev/android/index.html', function(err) { err && next(err); });
});
app.get(/\/ipad\/.*/, function(req, res, next) {
  res.sendfile('build/dev/ipad/index.html', function(err) { err && next(err); });
});
app.get(/\/iphone\/.*/, function(req, res, next) {
  res.sendfile('build/dev/iphone/index.html', function(err) { err && next(err); });
});
app.get(/.*/, function(req, res, next) {
  res.sendfile('build/dev/index.html', function(err) { err && next(err); });
});

secureApp.configure(function(){
    secureApp.use(express.logger());
    secureApp.use(resourceRewrite);
    secureApp.use(mocks.provider);
    secureApp.use(gzippo ? gzippo.staticGzip('build/dev') : connect.static('build/dev'));
    secureApp.use(app.router);
    secureApp.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

secureApp.get(/\/r\/.*/, function(req, res, next) {
  proxy.proxy(true)(req, res);
});
secureApp.get(/\/_wicket\/.*/, function(req, res, next) {
  proxy.proxy(true)(req, res);
});

secureApp.all('/m/j', proxy.proxy(true));

cors.setupCORS(port, securePort);

console.log("Starting phoenix proxy server on port", port, "and secure proxy on port", securePort, "proxying to", proxy.apiHost);
app.listen(port);
secureApp.listen(securePort);