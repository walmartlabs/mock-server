var async = require('async'),
    Convert = require('ansi-to-html'),
    convert = new Convert(),
    campfire = require('./campfire'),
    config = require('./config'),
    express = require('express'),
    log = require('./log');

module.exports = function(app, repo) {
  var branches = [],
      currentBranch;

  campfire.init(repo);

  app.get('/ms_admin', function(req, res) {
    async.parallel([
      function(callback) {
        if (config.isStandalone) {
          repo.remoteBranches(function(err, data) {
            branches = data;
            callback(err);
          });
        } else {
          callback();
        }
      },
      function(callback) {
        if (config.isStandalone) {
          repo.currentBranch(function(err, data) {
            currentBranch = data;
            callback(err);
          });
        } else {
          callback();
        }
      }
    ], function() {
      res.render('index', {
        isStandalone: config.isStandalone,
        gitPath: config.appDir,
        mocksEnabled: !!config.mocksEnabled,
        buildTarget: config.buildTarget || {},
        buildTargets: config.projectConfig['build-targets'] || [],
        servers: config.serverList,
        proxyServer: config.proxyServer,
        branches: branches || [],
        currentBranch: currentBranch,
        configText: JSON.stringify(config.localConfig || {}, undefined, 2),
        log: convert.toHtml(log.logs),
        error: log.errors
      });
    });
  });

  app.all('/ms_admin/proxy-server', express.bodyParser(), function(req, res) {
    log.reset();

    // Filter the user input
    var proxy = req.param('proxy');
    if ((config.serverList).indexOf(proxy) < 0) {
      res.redirect('/ms_admin');
      return;
    }

    config.proxyServer = proxy;
    campfire.speak('proxy changed to ' + config.proxyServer);
    res.redirect('/ms_admin');
  });
  app.all('/ms_admin/mocks', express.bodyParser(), function(req, res) {
    log.reset();

    config.mocksEnabled = req.param('enable-mocks');
    if (config.mocksEnabled === 'false') {
      config.mocksEnabled = false;
    }
    config.mocksEnabled = !!config.mocksEnabled;

    campfire.speak('mocksEnabled changed to ' + config.mocksEnabled);
    res.redirect('/ms_admin');
  });
  app.all('/ms_admin/build-target', express.bodyParser(), function(req, res) {
    log.reset();

    // Filter the input
    var target = parseInt(req.param('target'), 10);
    if (target < 0 || (config.projectConfig['build-targets'] || []).length <= target) {
      res.redirect('/ms_admin');
      return;
    }

    config.buildTarget = target;
    if (!config.isStandalone) {
      repo.build(function() {
        campfire.speak('build target changed to ' + config.buildTarget.name);
        res.redirect('/ms_admin');
      });
    }
  });
  app.all('/ms_admin/branch', express.bodyParser(), function(req, res) {
    log.reset();

    // Filter the input
    var branch = req.param('branch'),
        sameBranch = currentBranch === branch;
    console.log('branch', branch, branches, branches.indexOf(branch));
    if (branches.indexOf(branch) < 0) {
      res.redirect('/ms_admin');
      return;
    }

    console.log('Switching to branch', branch);
    async.series([
      function(callback) {
        // Skip checkout if we are already on this branch
        if (sameBranch) {
          callback();
        } else {
          repo.checkout(branch, callback);
        }
      },
      function(callback) {
        repo.pull(!sameBranch, function(err) {
          callback(err);
        });
      },
      function(callback) {
        repo.build(callback);
      }
    ],
    function(err) {
      err || campfire.speak('branch changed to ' + branch);
      res.redirect('/ms_admin');
    });
  });
  app.all('/ms_admin/pull', express.bodyParser(), function(req, res) {
    log.reset();

    module.exports.pull(repo, currentBranch, function() {
      res.redirect('/ms_admin');
    });
  });
  app.all('/ms_admin/config', express.bodyParser(), function(req, res) {
    try {
      config.localConfig = JSON.parse(req.param('config') || '{}');
     } catch (e) {}
    res.redirect('/ms_admin');
  });
};

module.exports.pull = function(repo, currentBranch, callback) {
  log.reset();

  async.series([
    function(callback) {
      repo.pull(callback);
    },
    function(callback) {
      repo.build(callback);
    }
  ],
  function(err) {
    if (err) {
      log.exception(err);
    }

    err || process.env.CAMPFIRE_QUIET || campfire.speak('pulled from ' + currentBranch);
    callback && callback(err);
  });
};
