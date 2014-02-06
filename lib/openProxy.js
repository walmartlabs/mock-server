var http = require('http'),
    url = require('url');

module.exports = function(req, res, next) {
  var proxiedUrl = {};
  try {
    proxiedUrl = url.parse(url.parse(req.url).path.match(/^\/proxy\/(.*)/));
  } catch (err) {}

  if (proxiedUrl) {
    // ensure all requests are network, and not something like file://
    proxiedUrl.protocol = proxiedUrl.protocol.indexOf('http') === 0 ? proxiedUrl.protocol : 'http:';

    http.get(proxiedUrl, function(proxyResult) {
      proxyResult.pipe(res);
    }).on('error', function(e) {
      next();
    });
  }
  else {
    next();
  }
};
