var debug = require("debug")("BroadcastEndpoint");
var async = require("neo-async");

var JSONFileLoader = require("../common/json_file_loader");
var Utils          = require("../common/utils");

var InvalidPayloadError = require("../errors/invalid_payload_error");

var channelSchema      = JSONFileLoader.loadSync("channel", "schema");
var notificationSchema = JSONFileLoader.loadSync("notification", "schema");

module.exports = function (channel, notification, callback, self) {
  if ( typeof channel === "object" )
    broadcastDevices(channel, callback, self);
  else
    broadcastChannelDevices(channel, notification, callback, self);
};

function broadcastDevices(notification, callback, self) {
  var notificationErrors = Utils.validateJSONWithSchema(notification, "notification", notificationSchema);

  if ( notificationErrors )
    return callback(new InvalidPayloadError("Unknown notification object type. Must be a valid iOS/MacOS, Safari or Android notification object", notificationErrors));

  debug("Notification object: " + JSON.stringify(notification));

  async.waterfall(
    [
      function (next) { self.requestsManager.verifyCredentials(next); },
      function (next) { self.requestsManager.broadcast(null, notification, next); }
    ],
    callback
  );
}

function broadcastChannelDevices(channel, notification, callback, self) {
  var channelErrors,
      notificationErrors;

  channelErrors      = Utils.validateJSONWithSchema(channel, "channel", channelSchema);
  notificationErrors = Utils.validateJSONWithSchema(notification, "notification", notificationSchema);

  if ( channelErrors )
    return callback(new InvalidPayloadError("Missing channel parameter", channelErrors));

  debug("Channel: " + channel);

  if ( notificationErrors )
    return callback(new InvalidPayloadError("Unknown notification object type. Must be a valid iOS/MacOS, Safari or Android notification object", notificationErrors));

  debug("Notification object: " + JSON.stringify(notification));

  async.waterfall(
    [
      function (next) { self.requestsManager.verifyCredentials(next); },
      function (next) { self.requestsManager.broadcast(channel, notification, next); }
    ],
    callback
  );
}
