var async = require('async'),
    childProcess = require('child_process'),
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
    },

    remoteBranches: function(callback) {
      async.series([
        function(callback) {
          childProcess.exec('git gc --prune=now', {cwd: path}, callback);
        },
        function(callback) {
          childProcess.exec('git for-each-ref --format="%(refname)" refs/remotes/origin', {cwd: path}, function(err, stdout, stderr) {
            var branches = stdout.split('\n')
                .filter(function(branch) { return branch && branch !== 'refs/remotes/origin/HEAD'; })
                .map(function(branch) { return branch.replace(/^refs\/remotes\/origin\//, ''); })
                .sort();
            console.error('branches', branches);
            callback(err, branches);
          });
        }
      ], callback);
    },
    currentBranch: function(callback) {
      childProcess.exec('git symbolic-ref -q HEAD', {cwd: path}, function(err, stdout, stderr) {
        var currentBranch = stdout.split('\n')
            .filter(function(branch) { return branch; })
            .map(function(branch) { return branch.replace(/^refs\/heads\//, ''); })[0];
        callback(err, currentBranch);
      });
    }
  };
};
