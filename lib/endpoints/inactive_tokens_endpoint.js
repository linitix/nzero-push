var debug = require("debug")("InactiveTokensEndpoint");
var async = require("neo-async");

var JSONFileLoader = require("../common/json_file_loader");
var Utils          = require("../common/utils");

var InvalidPayloadError = require("../errors/invalid_payload_error");

var IntegerSchema = JSONFileLoader.loadSync("integer", "schema");

module.exports = function (since, callback, self) {
  var integerErrors = Utils.validateJSONWithSchema(since, "integer", IntegerSchema);

  if ( integerErrors )
    return callback(new InvalidPayloadError("Must be an integer", integerErrors));

  debug("Since: " + since);

  async.waterfall(
    [
      function (next) { self.requestsManager.verifyCredentials(next); },
      function (next) { self.requestsManager.inactiveTokens(since, next); }
    ],
    callback
  );
};
