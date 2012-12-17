var config = require('./config'),
    url = require('url');

function setHeader(res, name, value) {
  if (res.setHeader) {
    res.setHeader(name, value);
  } else {
    res.headers[name] = value;
  }
}

exports.applyCORS = function(host, req, res) {

  var hostParse = /(?:.*?\/\/)?([^:]+)(?:\:(\d+))?/,
      hostInfo = hostParse.exec(host),
      originInfo = hostParse.exec(req.headers.origin);
  if (!hostInfo) {
    // Just bail.
    console.error('Unknown host in applyCORS', host);
    return;
  }
  if (hostInfo[1] !== originInfo[1]) {
    return;
  }

  setHeader(res, 'access-control-allow-origin', req.headers.origin);
};

exports.applyFullCORS = function(host, req, res) {
  exports.applyCORS(host, req, res);
  setHeader(res, 'access-control-allow-credentials', true);
  setHeader(res, 'access-control-allow-headers', 'X-Requested-With, Content-Type');
  setHeader(res, 'access-control-allow-methods', 'GET, POST, OPTIONS');
};
