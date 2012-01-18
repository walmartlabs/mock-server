var config = require('./config'),
    cookieMonster = require('./cookieMonster').cookieMonster,
    cors = require('./cors'),
    url = require("url");

var fs = require('fs');
var servicePattern = /service=([^&]+)/;
var methodPattern = /method=([^&]+)/;
var redirectPattern = /\/r\/phoenix\/index.html(.*)/;

exports.proxy = function(secure) {
  var http = secure ? require('https') : require('http');

  // Mirror the services layer on this instance
  return function(req, res) {
    var href = url.parse(req.url),
        options = {
            method: req.method,
            host: config.proxyServer,
            port: secure ? config.secureProxyPort : config.proxyPort,
            path: (href.pathname || "") + (href.search || ""),
            headers: req.headers
        },
        len = 0;

    // Rewrite standalone requests as they don't use the /m prefix
    if (config.standalone) {
        options.path = options.path.replace(/^\/m/, '');
    }

    var startTime = Date.now();
    
    if (options.path.match(/^\/r/)) {
      if (options.headers && options.headers.host) options.headers.host = options.host;
    }

    if (options.headers['accept-encoding']) delete options.headers['accept-encoding'];

    console.info("start proxy url:", req.url, "host:", options.host, "time:", startTime);
    var sourceReq = http.request(options, function(sourceRes) {
        var result = '';
        sourceRes.on("data", function(chunk) {
          result += chunk;
          len += chunk.length;
        });
        sourceRes.on("end", function() {
            console.info("proxied url", req.url, "length", len, "status", sourceRes.statusCode, "time:", Date.now()-startTime);
            res.write(result);
            res.end();

            if (config.logTrace) {
              var service = options.path.match(servicePattern);
              if (service && service.length) service = service[1];
              var method = options.path.match(methodPattern);
              if (method && method.length) method = method[1];
              var fileName = 'service-' + (service || '') + '_method-' + (method || '') + '_' + new Date().getTime() + ".log";
              
              var fd = fs.openSync((config.logTracePrefix || 'log') + "/" + fileName, "w");
              fs.writeSync(fd, req.method + req.url + '\nRequest Headers: ' + JSON.stringify(options.headers) + '\n\nResult Headers: ' + JSON.stringify(sourceRes.headers) + '\n\n' + result);
              fs.closeSync(fd);
            }
        });

        // Rewrite CORS for all
        cors.applyCORS(req, sourceRes);

        cookieMonster(req, sourceRes);
        
        // catch any redirects and forward to appropriate dev location
        if (sourceRes.headers.location && sourceRes.headers.location.match(redirectPattern)) {
          sourceRes.headers.location = '/' + sourceRes.headers.location.match(redirectPattern)[1];
        }
        res.writeHead(sourceRes.statusCode, sourceRes.headers);
    }).on("error", function(e) {
        console.info("error", e);
        res.send(502);
    });

    if (req.method !== 'GET' && req.method !== 'HEAD') {
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
