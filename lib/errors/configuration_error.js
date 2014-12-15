var util = require("util");

var AbstractError = require("./abstract_error");

var NAME = "Configuration Error";

util.inherits(ConfigurationError, AbstractError);

function ConfigurationError(message, referenceUrl) {
  AbstractError.call(this, message, this.constructor);
  this.name = NAME;
  this.referenceUrl = referenceUrl;
}

ConfigurationError.getName = function () { return NAME; };

module.exports = ConfigurationError;
