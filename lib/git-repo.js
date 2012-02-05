var childProcess = require('child_process'),
    config = require('./config');

module.exports = exports = function(path, remote) {
  return {
    init: function(callback) {
      if (remote) {
        childProcess.exec('git clone ' + remote + ' ' + path, {}, function(err, stdout, stderr) {
          console.log('Clone response', stdout, stderr);

          // Reload the config
          config.reloadProjectConfig();

          childProcess.exec(__dirname  + '/../bin/node ' + __dirname + '/../node_modules/npm/bin/npm-cli.js link', {cwd: path}, function(err, stdout, stderr) {
            console.log('Npm response', stdout, stderr);
            callback(err);
          });
        });
      } else {
        callback();
      }
    }
  };
};
