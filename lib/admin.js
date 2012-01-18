var async = require('async'),
    childProcess = require('child_process'),

    config = require('./config');

var log = '',
    error = '';

module.exports = function(app) {
  app.get('/ms_admin', function(req, res, next) {
    var branches,
        currentBranch;

    async.parallel([
      function(callback) {
        async.series([
          function(callback) {
            childProcess.exec('git gc --prune=now', {cwd: config.appDir}, callback);
          },
          function(callback) {
            childProcess.exec('git for-each-ref --format="%(refname)" refs/remotes/origin', {cwd: config.appDir}, function(err, stdout, stderr) {
              branches = stdout.split('\n')
                  .filter(function(branch) { return branch; })
                  .map(function(branch) { return branch.replace(/^refs\/remotes\/origin\//, ''); })
                  .sort();
              callback(err);
            });
          }
        ], callback);
      },
      function(callback) {
        childProcess.exec('git symbolic-ref -q HEAD', {cwd: config.appDir}, function(err, stdout, stderr) {
          currentBranch = stdout.split('\n')
              .filter(function(branch) { return branch; })
              .map(function(branch) { return branch.replace(/^refs\/heads\//, ''); })[0];
          callback(err);
        });
      }
    ], function(err) {
      res.render('index', {
        gitPath: config.appDir,
        mocksEnabled: !!config.mocksEnabled,
        servers: [
          'mobile.walmart.com',
          'mobile-e1.walmart.com',
          'mobile-e2.walmart.com',
          'mobile-e3.walmart.com',
          'mobile-e4.walmart.com',
          'mobile-e5.walmart.com',
          'mobile-e6.walmart.com'
        ],
        proxyServer: config.proxyServer,
        branches: branches,
        currentBranch: currentBranch,
        log: log, error: error
      });
    });
  });

  app.all('/ms_admin/proxy-server', function(req, res, next) {
    log = '';
    error = '';

    config.proxyServer = req.param('proxy');
    console.log('Switching proxy server to', config.proxyServer);
    res.redirect('/ms_admin');
  });
  app.all('/ms_admin/mocks', function(req, res, next) {
    log = '';
    error = '';

    config.mocksEnabled = req.param('enable-mocks');
    if (config.mocksEnabled === 'false') {
      config.mocksEnabled = false;
    }
    config.mocksEnabled = !!config.mocksEnabled;

    console.log('Setting mock state to', config.mocksEnabled);
    res.redirect('/ms_admin');
  });
  app.all('/ms_admin/branch', function(req, res, next) {
    var branch = req.param('branch');
    log = '';
    error = '';

    console.log('Switching to branch', branch);
    async.series([
      function(callback) {
        childProcess.exec('git checkout ' + branch, {cwd: config.appDir}, function(err, stdout, stderr) {
          console.log('Switch response', stdout, stderr);
          log += 'Checkout:\n' + stdout;
          error += 'Checkout:\n' + stderr;
          callbacK(err);
        });
      },
      function(callback) {
        childProcess.exec('git pull', {cwd: config.appDir}, function(err, stdout, stderr) {
          console.log('Pull response', stdout, stderr);
          log += 'Pull:\n' + stdout;
          error += 'Pull:\n' + stderr;
          callback(err);
        });
      },
      function(callback) {
        childProcess.exec('jake', {cwd: config.appDir}, function(err, stdout, stderr) {
          console.log('Build response', stdout, stderr);
          log += 'Build:\n' + stdout;
          error += 'Build:\n' + stderr;
          callback(err);
        });
      }
    ],
    function(err) {
      res.redirect('/ms_admin');
    });
  });
};
