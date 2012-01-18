var standalone = process.env.PHOENIX_API_HOST_STANDALONE;

// TODO : Move all of these env fields to arguments

// Simple object to keep state
module.exports = {
  mocksEnabled: process.env.ENABLE_MOCKS,
  eatCookies: process.env.PHOENIX_EAT_COOKIES,

  standalone: standalone,
  proxyPort: standalone ? 8081 : 80,
  secureProxyPort: standalone ? 8083 : 443,

  logTrace: process.env.PHOENIX_PROXY_TRACE,
  logTracePrefix: process.env.PHOENIX_PROXY_TRACE_PREFIX
};

if (module.exports.logTrace === "false") module.exports.logTrace = false;
