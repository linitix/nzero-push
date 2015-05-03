var NotifyEndpoint     = require("./notify_endpoint");
var RegisterEndpoint   = require("./register_endpoint");
var BroadcastEndpoint  = require("./broadcast_endpoint");
var UnregisterEndpoint = require("./unregister_endpoint");

module.exports = {
  notify    : NotifyEndpoint,
  register  : RegisterEndpoint,
  broadcast : BroadcastEndpoint,
  unregister: UnregisterEndpoint
};
