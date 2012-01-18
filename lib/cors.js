var config = require('./config'),
    url = require('url');

exports.applyCORS = function(host, res) {
  function setHeader(name, value) {
    if (res.setHeader) {
      res.setHeader(name, value);
    } else {
      res.headers[name] = value;
    }
  }

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

  setHeader('access-control-allow-origin', origin);
};
