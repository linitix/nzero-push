var debug = require("debug")("ChannelsEndpoint");
var async = require("neo-async");

var JSONFileLoader = require("../common/json_file_loader");
var Utils          = require("../common/utils");

var InvalidPayloadError = require("../errors/invalid_payload_error");

var IntegerSchema = JSONFileLoader.loadSync("integer", "schema");

module.exports = function (page, perPage, callback, self) {
  var pageErrors,
      perPageErrors;

  pageErrors    = Utils.validateJSONWithSchema(page, "integer", IntegerSchema);
  perPageErrors = Utils.validateJSONWithSchema(perPage, "integer", IntegerSchema);

  if ( pageErrors )
    return callback(new InvalidPayloadError("Must be an integer", pageErrors));

  debug("Page: " + page);

  if ( perPageErrors )
    return callback(new InvalidPayloadError("Must be an integer", perPageErrors));

  debug("Per page: " + perPage);

  if ( perPage > 100 )
    perPage = 100;

  async.waterfall(
    [
      function (next) { self.requestsManager.verifyCredentials(next); },
      function (next) { self.requestsManager.channels(page, perPage, next); }
    ],
    callback
  );
};
