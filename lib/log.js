var log = '',
    error = '';

module.exports = exports = {
  get logs() {
    return log;
  },
  get errors() {
    return error;
  },
  reset: function() {
    log = '';
    error = '';
  },

  log: function(msg, err) {
    log += msg || '';
    error += err || '';
  },
  exception: function(err) {
    error = err + error;
  }
};
