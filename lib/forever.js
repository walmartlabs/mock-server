var forever = require('forever-monitor'),
    path = require('path'),
    config = require('./config');

module.exports = function(app, secureApp) {
  var args = process.argv;
  var child

  args.splice(args.indexOf('--forever',1))

  console.log("\n\n\n\n\n" + args + "\n\n\n\n")

  child = forever.start(args, {
      max : 5
    });
};
