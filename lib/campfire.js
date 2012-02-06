var config = require('./config');

var campfireConfig = config.projectConfig.campfire || (process.env.CAMPFIRE ? JSON.parse(process.env.CAMPFIRE) : false);
if (!campfireConfig && process.env.DEPLOYHOOKS_CAMPFIRE_URL) {
  // Attempt to load from Heroku DEPLOYHOOKS_CAMPFIRE env
  campfireConfig = {
    account: process.env.DEPLOYHOOKS_CAMPFIRE_URL,
    token: process.env.DEPLOYHOOKS_CAMPFIRE_API_KEY,
    room: process.env.DEPLOYHOOKS_CAMPFIRE_ROOM,
    ssl: process.env.DEPLOYHOOKS_CAMPFIRE_SSL == 1
  };
}

if (campfireConfig) {
  var Campfire = require("campfire").Campfire,
      campfire = new Campfire(campfireConfig),
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

exports.speak = function(msg) {
  console.log(msg);
  if (campfireRoom) {
    campfireRoom.speak('mock-server ' + process.env.INSTANCE_NAME + ' ' + msg);
  }
};
