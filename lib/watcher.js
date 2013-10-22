var admin = require('./admin'),
    config = require('./config'),
    pubnub = require('pubnub');

pubnub = pubnub.init({
  publish_key: process.env.PUBNUB_PUBLISH_KEY || 'demo',
  subscribe_key: process.env.PUBNUB_SUBSCRIBE_KEY || 'demo',
  secret_key: process.env.PUBNUB_SECRET_KEY || '',
  ssl: false
});

module.exports = exports = function() {
  return {
    init: function(repo) {
      if (!config.isStandalone) {
        return;
      }

      pubnub.subscribe({
          channel: process.env.PUBNUB_CHANNEL || 'demo'
        },
        function(msg) {
          repo.currentBranch(function(err, branch) {
            if (err) {
              console.error('Watch failed:', err);
              return;
            }

            console.error('watch branch', branch, msg.ref, 'refs/heads/' + branch, msg.ref === 'refs/heads/' + branch);
            if (msg.ref === 'refs/heads/' + branch) {
              console.log('Updating branch', branch, 'updated to', msg.after);
              admin.pull(repo, branch, function(err) {
                if (err && !err.upToDate) {
                  return console.error(err);
                }
              });
            }
          });
        });
    }
  };
};