var debug = require("debug")("ChannelEndpoint");
var async = require("neo-async");

var JSONFileLoader = require("../common/json_file_loader");
var Utils          = require("../common/utils");

var InvalidPayloadError = require("../errors/invalid_payload_error");

var stringSchema = JSONFileLoader.loadSync("string", "schema");

module.exports = function (name, callback, self) {
  var nameErrors = Utils.validateJSONWithSchema(name, "string", stringSchema);

  if ( nameErrors )
    return callback(new InvalidPayloadError("Must be a string", nameErrors));

  async.waterfall(
    [
      function (next) { self.requestsManager.verifyCredentials(next); },
      function (next) { self.requestsManager.channel(name, next); }
    ],
    callback
  );
};
