var async = require('async'),
    childProcess = require('child_process'),
    config = require('./config'),
    fs = require('fs');

module.exports = exports = function(path, remote) {
  return {
    init: function(callback) {
      var self = this;

      function pull() {
        self.pull(function(err) {
          // Force config reload on error
          if (err && err.upToDate) {
            config.reloadProjectConfig();
          }
          callback(err);
        });
      }

      if (remote) {
        try {
          fs.statSync(path + '/.git');
          pull();
        } catch (err) {
          this.clone(callback);
        }
      } else {
        pull();
      }
    },

    clone: function(callback) {
      var self = this;
      childProcess.exec('git clone ' + remote + ' ' + path, {}, function(err, stdout, stderr) {
        console.log('Clone response', stdout, stderr);

        // Reload the config
        config.reloadProjectConfig();

        self.link(callback);
      });
    },

    pull: function(forceReload, callback) {
      if (!callback && typeof forceReload === 'function') {
        callback = forceReload;
        forceReload = false;
      }

      var self = this;
      childProcess.exec('git pull', {cwd: path}, function(err, stdout, stderr) {
        console.log('Pull response', stdout, stderr);

        if (!forceReload && stdout === 'Already up-to-date.\n') {
          var err = new Error('Already up-to-date');
          err.upToDate = true;
          return callback(err);
        }

        // Reload the config
        config.reloadProjectConfig();

        self.link(callback);
      });
    },

    link: function(callback) {
      childProcess.exec('node ' + __dirname + '/../node_modules/npm/bin/npm-cli.js link', {cwd: path}, function(err, stdout, stderr) {
        console.log('Npm link response', stdout, stderr);
        callback(err);
      });
    },

    checkout: function(branch, callback) {
      childProcess.exec('git checkout ' + branch, {cwd: path}, function(err, stdout, stderr) {
        console.log('Switch response', stdout, stderr);
        callback(err);
      });
    },

    remoteBranches: function(callback) {
      var branches;
      async.series([
        function(callback) {
          childProcess.exec('git gc --prune=now', {cwd: path}, callback);
        },
        function(callback) {
          childProcess.exec('git for-each-ref --format="%(refname)" refs/remotes/origin', {cwd: path}, function(err, stdout, stderr) {
            branches = stdout.split('\n')
                .filter(function(branch) { return branch && branch !== 'refs/remotes/origin/HEAD'; })
                .map(function(branch) { return branch.replace(/^refs\/remotes\/origin\//, ''); })
                .sort();
            callback(err);
          });
        }
      ], function(err) {
        callback(err, branches);
      });
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
