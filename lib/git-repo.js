var async = require('async'),
    childProcess = require('child_process'),
    config = require('./config'),
    fs = require('fs'),
    log = require('./log');

function loggedExec(tag, cmd, options, callback) {
  log.log(cmd + '\n', cmd + '\n');
  childProcess.exec(cmd, options, function(err, stdout, stderr) {
    if (err) {
      console.log(tag, 'error', err);
    }

    console.log(tag, 'response', stdout, stderr);
    log.log(stdout + '\n', stderr + '\n');
    callback(err, stdout, stderr);
  });
}

module.exports = exports = function(path, remote) {
  return {
    building: config.isHeroku,

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
        config.reloadProjectConfig();
        callback();
      }
    },

    clone: function(callback) {
      var self = this;
      loggedExec('Clone', 'git clone --recursive ' + remote + ' ' + path, {}, function(err, stdout, stderr) {
        self.checkout(process.env.DEFAULT_BRANCH || 'master', function(err, stdout, stderr) {
          self.updateSubmodules(function() {
            // Reload the config
            config.reloadProjectConfig();

            self.link(callback);
          });
        });
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

        self.updateSubmodules(function() {
          // Reload the config
          config.reloadProjectConfig();

          self.link(callback);
        });
      });
    },

    updateSubmodules: function(callback) {
      loggedExec('Switch', 'git submodule update --init --recursive', {cwd: path}, callback);
    },

    link: function(callback) {
      try {
        // Check for existence of package.json before trying to run anything
        fs.statSync(path + '/package.json');

        loggedExec('Npm link', 'node ' + __dirname + '/../node_modules/npm/bin/npm-cli.js link', {cwd: path}, callback);
      } catch (err) {
        // Ignore
        console.log('link error', err);
        callback();
      }
    },

    build: function(callback) {
      var target = config.buildTarget,
          self = this;
      if (!target || !target['build-command']) {
        return callback();
      }

      var command = target['build-command'].replace(/\bjake\b/g, 'node ' + __dirname + '/../node_modules/jake/bin/cli.js');
      console.log('Building', command);
      loggedExec('Build', command, {cwd: config.appDir + '/'}, function(err, stdout, stderr) {
        self.building = false;
        callback(err);
      });
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
