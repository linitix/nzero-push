var debug = require("debug")("SetBadgeEndpoint");
var async = require("neo-async");

var JSONFileLoader = require("../common/json_file_loader");
var Utils          = require("../common/utils");

var InvalidPayloadError = require("../errors/invalid_payload_error");

var deviceTokensSchema = JSONFileLoader.loadSync("device_tokens", "schema");
var stringSchema       = JSONFileLoader.loadSync("string", "schema");

module.exports = function (deviceTokens, badge, callback, self) {
  var deviceTokensErrors,
      stringErrors;

  deviceTokensErrors = Utils.validateJSONWithSchema(deviceTokens, "device_tokens", deviceTokensSchema);
  stringErrors       = Utils.validateJSONWithSchema(badge, "string", stringSchema);

  if ( deviceTokensErrors )
    return callback(new InvalidPayloadError("Device tokens must be an array with at least one item or unique items of type string", deviceTokensErrors));

  debug("Device tokens: " + JSON.stringify(deviceTokens));

  if ( stringErrors )
    return callback(new InvalidPayloadError("Badge parameter must be a string (ex: \"+1\")", stringErrors));

  debug("Badge: " + badge);

  async.waterfall(
    [
      function (next) { self.requestsManager.verifyCredentials(next); },
      function (next) { setBadgeForDeviceTokens(deviceTokens, badge, next, self); }
    ],
    callback
  );
};

function setBadgeForDeviceTokens(deviceTokens, badge, callback, self) {
  var data = {
    badgeSet   : [],
    badgeNotSet: []
  };

  async.each(
    deviceTokens,
    function (deviceToken, next) {
      debug("Set badge device token: " + deviceToken);

      self.requestsManager.setBadge(deviceToken, badge, function (err) {
        if ( err )
          data.badgeNotSet.push({ device_token: deviceToken, error: err });
        else
          data.badgeSet.push({ device_token: deviceToken });

        next();
      });
    },
    function (err) { callback(err, data); }
  );
}
