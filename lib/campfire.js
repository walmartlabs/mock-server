var config = require('./config');

var repo;

var campfireConfig = config.projectConfig.campfire || (process.env.CAMPFIRE ? JSON.parse(process.env.CAMPFIRE) : false);
if (!campfireConfig && process.env.DEPLOYHOOKS_CAMPFIRE_URL) {
  // Attempt to load from Heroku DEPLOYHOOKS_CAMPFIRE env
  campfireConfig = {
    account: process.env.DEPLOYHOOKS_CAMPFIRE_URL,
    token: process.env.DEPLOYHOOKS_CAMPFIRE_API_KEY,
    room: process.env.DEPLOYHOOKS_CAMPFIRE_ROOM,
    ssl: process.env.DEPLOYHOOKS_CAMPFIRE_SSL === 1 || process.env.DEPLOYHOOKS_CAMPFIRE_SSL === '1'
  };
}

if (config.isStandalone && campfireConfig) {
  var Campfire = punchCampfire(require("campfire").Campfire),
      campfire = new Campfire(campfireConfig),
      campfireRoom;

  campfire.rooms(function(err, rooms) {
    var room = (rooms || []).filter(function(room) {
      return room.name === campfireConfig.room;
    })[0];
    if (room) {
      campfire.join(room.id, function(error, room) {
        listen(room);
        campfireRoom = room;
      });
    } else {
      console.error('Unknown campfire room', campfireConfig.room);
    }
  });

  function listen(room) {
    var instanceName = process.env.INSTANCE_NAME ? process.env.INSTANCE_NAME.split(/\./)[0] : '';
    room.listen(function(message) {
      if (message.body === 'mockery' || message.body === 'mockery ' + instanceName) {
        console.log('status ping recieved');

        repo.currentBranch(function(err, branch) {
          room.paste(
            process.env.INSTANCE_NAME + (config.mocksEnabled ? ' is mocking you' : ' wants to mock you but isn\'t currently')
            + '\n\tbranch: ' + branch
            + '\n\tserver: ' + config.proxyServer);
        });
      }
    });
  }
}

exports.init = function(_repo) {
  repo = _repo;
};
exports.speak = function(msg) {
  console.log(msg);
  if (campfireRoom) {
    campfireRoom.speak('mock-server ' + process.env.INSTANCE_NAME + ' ' + msg);
  }
};


// Patch campfire implementation to avoid a blow up
function punchCampfire(Campfire) {
  if (Campfire._duckPunched) {
    return Campfire;
  }

  Campfire._duckPunched = true;
  var $super = Campfire.prototype.request;
  Campfire.prototype.request = function(method, path, body, callback) {
    $super.call(this, method, path, body, function(err, data) {
      try {
        callback.call(this, err, data);
      } catch (err) {
        console.error('Failed to process callback ' + path, err, data);
      }
    });
  };

  return Campfire;
}
