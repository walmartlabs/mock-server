// Cookie remapper/filter

// WARN : No rhyme or reason here, just removing random cookies didn't seem to break anything.
const EAT_COOKIE = process.env.PHOENIX_EAT_COOKIES ? {} : {
  'jsessionid': true,
  'm_zdr': true,
  'dcenv': true,
  'cef.env': true,
  'cef.secureenv': true,
  'prefses': true,
  'spcf.backup': true,
  'sslb': true,
};

function parseCookie(cookie) {
  var match = /(.*?)=('[^']*'|"[^"]"|[^;]*)\s*;?\s*(.*)/.exec(cookie);

  if (match) {
    var parsed = {
      name: match[1],
      value: match[2],
      obj: {}
    };

    var params = match[3].split(/\s*;\s*/);
    for (var i = 0, len = params.length; i < len; i++) {
      var kv = params[i].split(/\s*=\s*/);
      kv[0] = kv[0].toLowerCase();
      parsed.obj[kv[0]] = kv[1];
    }
    return parsed;
  }
}
exports.cookieMonster = function(req, sourceRes) {
  var domainRewrite = req.headers.host.replace(/:.*/, ''),
      cookie = sourceRes.headers['set-cookie'] || [],
      ret = [];

  var domainComponents = domainRewrite.split('.').slice(-2);
  domainComponents.unshift('');
  domainRewrite = domainComponents.join('.');

  // Me want cookie
  for (var i = 0, len = cookie.length; i < len; i++) {
    var parsed = parseCookie(cookie[i]);

    // Omm nom nom nom (Kill the BS we don't need)
    if (parsed && !EAT_COOKIE[parsed.name.toLowerCase()]) {
      parsed.obj.domain = domainRewrite;

      // Reworked from the connect lib
      var pairs = [parsed.name + '=' + parsed.value];
      if (parsed.obj.domain) pairs.push('domain=' + parsed.obj.domain);
      if (parsed.obj.path) pairs.push('path=' + parsed.obj.path);
      if (parsed.obj.expires) pairs.push('expires=' + parsed.obj.expires);
      if (parsed.obj.httpOnly) pairs.push('httpOnly');
      if (parsed.obj.secure) pairs.push('secure');

      ret.push(pairs.join('; '));
    }
  }

  sourceRes.headers['set-cookie'] = ret;
}
