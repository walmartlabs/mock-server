var io = require('socket.io'),
    watch = require('watch'),
    path = require('path'),
    config = require('./config');

function debounce(func, wait) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      func.apply(context, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

module.exports = function(app, secureApp) {
  var listener = io.listen(app);
  listener.set('log level', 1);
  
  if (secureApp) {
    var secureListener = io.listen(secureApp);
    secureListener.set('log level', 1);
  }

  var emitter = debounce(function() {
    listener.sockets.emit('reload');
    if (secureListener) {
      secureListener.sockets.emit('reload');
    }
  }, 100);

  var watch_path = path.join(config.appDir, (config.buildTarget || {}).path || 'build');

  watch.watchTree(watch_path, function (filename, curr, prev) {
    emitter();
  });
};
