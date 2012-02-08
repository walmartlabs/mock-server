var async = require('async'),
    childProcess = require('child_process'),
    config = require('./config'),
    fs = require('fs'),
    log = require('./log'),
    staticShim = require('./static-shim');

function loggedExec(tag, cmd, options, callback) {
  childProcess.exec(cmd, options, function(err, stdout, stderr) {
    console.log(tag, 'response', stdout, stderr);
    log.log(cmd + '\n' + stdout + '\n', cmd + '\n' + stderr + '\n');
    callback(err, stdout, stderr);
  });
}

module.exports = exports = function(path, remote) {
  return {
    init: function(callback) {
      var self = this;

      function pull() {
        self.pull(function(err) {
          // Force config reload on error
          if (err && err.upToDate) {
            config.reloadProjectConfig();
            staticShim.init();
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
      }
    },

    clone: function(callback) {
      var self = this;
      loggedExec('Clone', 'git clone ' + remote + ' ' + path, {}, function(err, stdout, stderr) {
        // Reload the config
        config.reloadProjectConfig();
        staticShim.init();

        self.link(callback);
      });
    },

    pull: function(forceReload, callback) {
      if (!callback && typeof forceReload === 'function') {
        callback = forceReload;
        forceReload = false;
      }

      var self = this;
      loggedExec('Pull', 'git pull', {cwd: path}, function(err, stdout, stderr) {
        if (!forceReload && stdout === 'Already up-to-date.\n') {
          var err = new Error('Already up-to-date');
          err.upToDate = true;
          return callback(err);
        }

        // Reload the config
        config.reloadProjectConfig();
        staticShim.init();

        self.link(callback);
      });
    },

    link: function(callback) {
      loggedExec('Npm link', 'node ' + __dirname + '/../node_modules/npm/bin/npm-cli.js link', {cwd: path}, callback);
    },

    build: function(callback) {
      var target = config.buildTarget;
      if (!target || !target['build-command']) {
        return callback();
      }

      var command = target['build-command'].replace(/\bjake\b/g, 'node ' + __dirname + '/../node_modules/jake/bin/cli.js');
      console.log('Building', command);
      loggedExec('Build', command, {cwd: config.appDir + '/'}, callback);
    },

    checkout: function(branch, callback) {
      loggedExec('Switch', 'git checkout ' + branch, {cwd: path}, callback);
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
