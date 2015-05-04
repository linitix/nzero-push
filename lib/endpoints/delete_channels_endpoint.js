var debug = require("debug")("DeleteChannelsEndpoint");
var async = require("neo-async");

var JSONFileLoader = require("../common/json_file_loader");
var Utils          = require("../common/utils");

var InvalidPayloadError = require("../errors/invalid_payload_error");

var channelsSchema = JSONFileLoader.loadSync("channels", "schema");

module.exports = function (channels, callback, self) {
  var channelsErrors = Utils.validateJSONWithSchema(channels, "channels", channelsSchema);

  if ( channelsErrors )
    return callback(new InvalidPayloadError("Channels must be an array with at least one item or unique items of type string", channelsErrors));

  debug("Channels: " + JSON.stringify(channels));

  async.waterfall(
    [
      function (next) { self.requestsManager.verifyCredentials(next); },
      function (next) { deleteChannels(channels, next, self); }
    ],
    callback
  );
};

function deleteChannels(channels, callback, self) {
  var data = {
    deleted   : [],
    notDeleted: []
  };

  async.each(
    channels,
    function (channel, next) {
      debug("Deleting channel: " + channel + " ...");

      self.requestsManager.deleteChannel(channel, function (err, body) {
        if ( err )
          data.notDeleted.push({ channel: channel, error: err });
        else
          data.deleted.push(body);

        next();
      });
    },
    function (err) { callback(err, data); }
  );
}
