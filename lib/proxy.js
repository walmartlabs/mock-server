var _ = require('underscore'),
    config = require('./config'),
    cookieMonster = require('./cookieMonster').cookieMonster,
    cors = require('./cors'),
    http = require('http'),
    https = require('https'),
    url = require("url");

var fs = require('fs');
var servicePattern = /service=([^&]+)/;
var methodPattern = /method=([^&]+)/;

exports.proxy = function(secure) {

  // Mirror the services layer on this instance
  return function(req, res, next) {
    if (!config.proxyServer) {
      return next();
    }

    var forwarded = req.headers['x-forwarded-proto'] === 'https',
        port = secure || forwarded ? config.secureProxyPort : config.proxyPort,
        href = url.parse(req.url),
        options = {
            method: req.method,
            host: config.proxyServer,
            port: port,
            path: (href.pathname || "") + (href.search || ""),
            headers: _.defaults({
                host: config.proxyServer + (port !== 80 && port !== 443 ? (':' + port) : ''),

                // Disabled chunking for OPTIONS. It appears this is an Akami bug as the response hangs
                // for chunked zero-length requests
                'content-length': (req.method === 'OPTIONS' || req.method === 'GET') ? 0 : undefined
              },
              req.headers)
        },
        len = 0;

    // Rewrite standalone requests as they don't use the /m prefix
    if (config.standalone) {
        options.path = options.path.replace(/^\/m/, '');
    }

    var startTime = Date.now();

    // Remap the host param to prevent funky redirects
    var originalHost = req.headers['x-forwarded-host'] || req.headers.host;

    if (config.logTrace && options.headers['accept-encoding']) {
      delete options.headers['accept-encoding'];
    }

    console.info('start proxy url:', req.url, 'method:', req.method, 'host:', options.host, 'time:', startTime);
    var sourceReq = (secure || forwarded ? https : http).request(options, function(sourceRes) {
        var result = '';
        sourceRes.on("data", function(chunk) {
          res.write(chunk);
          result += chunk;
          len += chunk.length;
        });
        sourceRes.on("end", function() {
            console.info("proxied url", req.url, "length", len, "status", sourceRes.statusCode, "time:", Date.now()-startTime);
            res.end();

            if (config.logTrace) {
              var service = options.path.match(servicePattern);
              if (service && service.length) {
                service = service[1];
              }
              var method = options.path.match(methodPattern);
              if (method && method.length) {
                method = method[1];
              }
              var fileName = 'service-' + (service || '') + '_method-' + (method || '') + '_' + new Date().getTime() + ".log";

              var fd = fs.openSync((config.logTracePrefix || 'log') + "/" + fileName, "w");
              fs.writeSync(fd, req.method + req.url + '\nRequest Headers: ' + JSON.stringify(options.headers) + '\n\nResult Headers: ' + JSON.stringify(sourceRes.headers) + '\n\n' + result);
              fs.closeSync(fd);
            }
        });

        // Rewrite CORS for all
        cors[config.forceCors ? 'applyFullCORS' : 'applyCORS'](originalHost, req, sourceRes);

        cookieMonster(originalHost, sourceRes);

        // Make sure that we redirect and stay within this server
        if (sourceRes.statusCode === 302) {
          var redirect = url.parse(sourceRes.headers.location),
              host = originalHost.split(':')[0];
          if (redirect.hostname === host || redirect.hostname === config.proxyServer) {
            redirect.hostname = host;
            redirect.port = (redirect.protocol === 'http:') ? config.forwardPort : config.securePort;
            redirect.host = redirect.hostname + ':' + redirect.port;
            sourceRes.headers.location = url.format(redirect);
          }
        }

        res.writeHead(sourceRes.statusCode, sourceRes.headers);
    }).on("error", function(e) {
        console.info("error", e);
        res.send(502);
    });

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
      req.on('data', function(chunk) {
        sourceReq.write(chunk);
      });
      req.on('end', function() {
        sourceReq.end();
      });
    } else {
      sourceReq.end();
    }
  };
};
