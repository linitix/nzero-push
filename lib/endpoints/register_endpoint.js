var debug = require("debug")("RegisterEndpoint");
var async = require("neo-async");

var JSONFileLoader = require("../common/json_file_loader");
var Utils          = require("../common/utils");

var InvalidPayloadError = require("../errors/invalid_payload_error");

var deviceTokensSchema = JSONFileLoader.loadSync("device_tokens", "schema");
var channelsSchema     = JSONFileLoader.loadSync("channels", "schema");

module.exports = function (deviceTokens, channels, callback, self) {
  var deviceTokensErrors = Utils.validateJSONWithSchema(deviceTokens, "device_tokens", deviceTokensSchema);

  if ( deviceTokensErrors )
    return callback(new InvalidPayloadError("Device tokens must be an array with at least one item or unique items of type string", deviceTokensErrors));

  debug("Device tokens: " + JSON.stringify(deviceTokens));

  async.waterfall(
    [
      function (next) { self.requestsManager.verifyCredentials(next); },
      function (next) {
        if ( typeof channels === "function" )
          registerDeviceTokens(deviceTokens, next, self);
        else
          registerDeviceTokensForChannels(deviceTokens, channels, next, self);
      }
    ],
    callback
  );
};

function registerDeviceTokens(deviceTokens, callback, self) {
  var data = {
    registered  : [],
    unregistered: []
  };

  async.each(
    deviceTokens,
    function (deviceToken, next) {
      debug("Registering device token: " + deviceToken);

      self.requestsManager.register(deviceToken, null, function (err) {
        if ( err )
          data.unregistered.push({ device_token: deviceToken, error: err });
        else
          data.registered.push({ device_token: deviceToken });

        next();
      });
    },
    function (err) { callback(err, data); }
  );
}

function registerDeviceTokensForChannels(deviceTokens, channels, callback, self) {
  var channelsErrors = Utils.validateJSONWithSchema(channels, "channels", channelsSchema);

  if ( channelsErrors )
    return callback(new InvalidPayloadError("Channels must be an array with at least one item or unique items of type string", channelsErrors));

  debug("Channels: " + JSON.stringify(channels));

  var data = {
    registered  : [],
    unregistered: []
  };

  async.each(
    deviceTokens,
    function (deviceToken, next) {
      debug("Registering device token: " + deviceToken);

      async.each(
        channels,
        function (channel, next) {
          debug("For channel: " + channel);

          self.requestsManager.register(deviceToken, channel, function (err) {
            if ( err )
              data.unregistered.push({ device_token: deviceToken, channel: channel, error: err });
            else
              data.registered.push({ device_token: deviceToken, channel: channel });

            next();
          });
        },
        function (err) { next(err); }
      );
    },
    function (err) { callback(err, data); }
  );
}
