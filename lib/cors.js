var config = require('./config'),
    url = require('url');

function setHeader(res, name, value) {
  if (res.setHeader) {
    res.setHeader(name, value);
  } else {
    res.headers[name] = value;
  }
}

exports.applyCORS = function(host, res) {

  var hostInfo = /([^:]+)(?:\:(\d+))?/.exec(host);
  if (!hostInfo) {
    // Just bail.
    console.error('Unknown host in applyCORS', host);
    return;
  }

  var port = parseInt(hostInfo[2]),
      origin;
  if (port === config.securePort) {
    origin = 'http://' + hostInfo[1] + ':' + config.port;
  } else {
    origin = 'https://' + hostInfo[1] + ':' + config.securePort;
  }

  setHeader(res, 'access-control-allow-origin', origin);
};

exports.applyFullCORS = function(host, res) {
  exports.applyCORS(host, res);
  setHeader(res, 'access-control-allow-credentials', true);
  setHeader(res, 'access-control-allow-headers', 'X-Requested-With, Content-Type');
  setHeader(res, 'access-control-allow-methods', 'GET, POST, OPTIONS');
};
