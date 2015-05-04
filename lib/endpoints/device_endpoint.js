var debug = require("debug")("ChannelEndpoint");
var async = require("neo-async");

var JSONFileLoader = require("../common/json_file_loader");
var Utils          = require("../common/utils");

var InvalidPayloadError = require("../errors/invalid_payload_error");

var stringSchema = JSONFileLoader.loadSync("integer", "schema");

module.exports = function (deviceToken, callback, self) {
  var deviceTokenErrors = Utils.validateJSONWithSchema(deviceToken, "string", stringSchema);

  if ( deviceTokenErrors )
    return callback(new InvalidPayloadError("Device token must be a string", deviceTokenErrors));

  async.waterfall(
    [
      function (next) { self.requestsManager.verifyCredentials(next); },
      function (next) { self.requestsManager.device(deviceToken, next); }
    ],
    callback
  );
};
