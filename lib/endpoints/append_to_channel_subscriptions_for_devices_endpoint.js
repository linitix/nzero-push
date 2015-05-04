var debug = require("debug")("RegisterEndpoint");
var async = require("neo-async");

var JSONFileLoader = require("../common/json_file_loader");
var Utils          = require("../common/utils");

var InvalidPayloadError = require("../errors/invalid_payload_error");

var deviceTokensSchema = JSONFileLoader.loadSync("device_tokens", "schema");
var channelsSchema     = JSONFileLoader.loadSync("channels", "schema");

module.exports = function (deviceTokens, channels, callback, self) {
  var deviceTokensErrors,
      channelsErrors;
  var data = {
    appended   : [],
    notAppended: []
  };

  deviceTokensErrors = Utils.validateJSONWithSchema(deviceTokens, "device_tokens", deviceTokensSchema);
  channelsErrors     = Utils.validateJSONWithSchema(channels, "channels", channelsSchema);

  if ( deviceTokensErrors )
    return callback(new InvalidPayloadError("Device tokens must be an array with at least one item or unique items of type string", deviceTokensErrors));

  debug("Device tokens: " + JSON.stringify(deviceTokens));

  if ( channelsErrors )
    return callback(new InvalidPayloadError("Channels must be an array with at least one item or unique items of type string", channelsErrors));

  debug("Channels: " + JSON.stringify(channels));

  async.each(
    deviceTokens,
    function (deviceToken, next) {
      debug("Appending channels to device token: " + deviceToken);

      self.requestsManager.appendToChannelSubscriptionForDevice(deviceToken, channels, function (err, body) {
        if ( err )
          data.notAppended.push({ device_token: deviceToken, channels: channels, error: err });
        else
          data.appended.push(body);

        next();
      });
    },
    function (err) { callback(err, data); }
  );
};
