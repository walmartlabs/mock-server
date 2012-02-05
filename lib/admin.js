var async = require('async'),
    Campfire,
    childProcess = require('child_process'),
    config = require('./config'),
    express = require('express'),
    staticShim = require('./static-shim');

var log = '',
    error = '';

var repo = require('./git-repo')(config.appDir, process.env.MOCK_REPO);
repo.init(function(err) {
  console.error(error);
});

var campfireConfig = config.projectConfig.campfire
if (campfireConfig) {
  Campfire = require("campfire").Campfire
  var campfire = new Campfire(campfireConfig),
      campfireRoom;

  campfire.rooms(function(err, rooms) {
    var room = (rooms || []).filter(function(room) {
      return room.name === campfireConfig.room;
    })[0];
    if (room) {
      campfire.join(room.id, function(error, room) {
        campfireRoom = room;
      });
    } else {
      console.error('Unknown campfire room', campfireConfig.room);
    }
  });
}

function build(callback) {
  var target = config.buildTarget;
  if (!target || !target['build-command']) {
    return callback();
  }

  staticShim.init();
  childProcess.exec(target['build-command'], {cwd: config.appDir}, function(err, stdout, stderr) {
    console.log('Build response', stdout, stderr);
    log += 'Build:\n' + stdout;
    error += 'Build:\n' + stderr;
    callback(err);
  });
}

module.exports = function(app) {
  app.get('/ms_admin', function(req, res, next) {
    var branches,
        currentBranch;

    async.parallel([
      function(callback) {
        repo.remoteBranches(function(err, data) {
          branches = data;
          callback(err);
        });
      },
      function(callback) {
        repo.currentBranch(function(err, data) {
          currentBranch = data;
          callback(err);
        });
      }
    ], function(err) {
      res.render('index', {
        gitPath: config.appDir,
        mocksEnabled: !!config.mocksEnabled,
        buildTarget: config.buildTarget || {},
        buildTargets: config.projectConfig['build-targets'] || [],
        servers: config.projectConfig.servers || [],
        proxyServer: config.proxyServer,
        branches: branches || [],
        currentBranch: currentBranch,
        log: log, error: error
      });
    });
  });

  app.all('/ms_admin/proxy-server', express.bodyParser(), function(req, res, next) {
    log = '';
    error = '';

    config.proxyServer = req.param('proxy');
    console.log('Switching proxy server to', config.proxyServer);
    if (campfireRoom) {
      campfireRoom.speak('mock-server ' + req.headers.host + ' proxy changed to ' + config.proxyServer);
    }
    res.redirect('/ms_admin');
  });
  app.all('/ms_admin/mocks', express.bodyParser(), function(req, res, next) {
    log = '';
    error = '';

    config.mocksEnabled = req.param('enable-mocks');
    if (config.mocksEnabled === 'false') {
      config.mocksEnabled = false;
    }
    config.mocksEnabled = !!config.mocksEnabled;

    console.log('Setting mock state to', config.mocksEnabled);
    if (campfireRoom) {
      campfireRoom.speak('mock-server ' + req.headers.host + ' mocksEnabled changed to ' + config.mocksEnabled);
    }
    res.redirect('/ms_admin');
  });
  app.all('/ms_admin/build-target', express.bodyParser(), function(req, res, next) {
    log = '';
    error = '';

    config.buildTarget = req.param('target');
    build(function() {
      console.log('Setting mock state to', config.mocksEnabled);
      if (campfireRoom) {
        campfireRoom.speak('mock-server ' + req.headers.host + ' build target changed to ' + config.buildTarget.name);
      }
      res.redirect('/ms_admin');
    });
  });
  app.all('/ms_admin/branch', express.bodyParser(), function(req, res, next) {
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
          callback(err);
        });
      },
      function(callback) {
        childProcess.exec('git pull', {cwd: config.appDir}, function(err, stdout, stderr) {
          console.log('Pull response', stdout, stderr);
          log += 'Pull:\n' + stdout;
          error += 'Pull:\n' + stderr;

          // Reload the config
          config.reloadProjectConfig();

          callback(err);
        });
      },
      function(callback) {
        build(callback);
      }
    ],
    function(err) {
      if (campfireRoom && !err) {
        campfireRoom.speak('mock-server ' + req.headers.host + ' branch changed to ' + branch);
      }
      res.redirect('/ms_admin');
    });
  });
};

module.exports.build = build;
