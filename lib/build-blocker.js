var log = require('./log');

var repo;

module.exports = exports = {
  init: function(repository) {
    repo = repository;
  },
  middleware: function(req, res, next) {
    if (!repo || repo.building) {
      res.render('building', {
        log: log.logs,
        error: log.errors
      });
    } else {
      next();
    }
  }
};
