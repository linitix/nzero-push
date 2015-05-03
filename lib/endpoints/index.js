var NotifyEndpoint   = require("./notify_endpoint");
var RegisterEndpoint = require("./register_endpoint");

module.exports = {
  notify  : NotifyEndpoint,
  register: RegisterEndpoint
};
