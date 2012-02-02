var childProcess = require('child_process');

module.exports = exports = function(path, remote) {
  return {
    init: function(callback) {
      if (remote) {
        childProcess.exec('git clone ' + remote + ' ' + path, {}, function(err, stdout, stderr) {
          console.log('Clone response', stdout, stderr);
          log += 'Pull:\n' + stdout;
          error += 'Pull:\n' + stderr;

          // Reload the config
          config.reloadProjectConfig();

          callback(err);
        });
      } else {
        callback();
      }
    }
  };
};
