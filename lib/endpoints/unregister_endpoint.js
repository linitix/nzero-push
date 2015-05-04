var debug = require("debug")("UnregisterEndpoint");
var async = require("neo-async");

var JSONFileLoader = require("../common/json_file_loader");
var Utils          = require("../common/utils");

var InvalidPayloadError = require("../errors/invalid_payload_error");

var deviceTokensSchema = JSONFileLoader.loadSync("device_tokens", "schema");

module.exports = function (deviceTokens, callback, self) {
  var deviceTokensErrors = Utils.validateJSONWithSchema(deviceTokens, "device_tokens", deviceTokensSchema);

  if ( deviceTokensErrors )
    return callback(new InvalidPayloadError("Device tokens must be an array with at least one item or unique items of type string", deviceTokensErrors));

  debug("Device tokens: " + JSON.stringify(deviceTokens));

  async.waterfall(
    [
      function (next) { self.requestsManager.verifyCredentials(next); },
      function (next) { unregisterDeviceTokens(deviceTokens, next, self); }
    ],
    callback
  );
};

function unregisterDeviceTokens(deviceTokens, callback, self) {
  var data = {
    registered  : [],
    unregistered: []
  };

  async.each(
    deviceTokens,
    function (deviceToken, next) {
      debug("Unregistering device token: " + deviceToken);

      self.requestsManager.unregister(deviceToken, function (err) {
        if ( err )
          data.registered.push({ device_token: deviceToken, error: err });
        else
          data.unregistered.push({ device_token: deviceToken });

        next();
      });
    },
    function (err) { callback(err, data); }
  );
}
