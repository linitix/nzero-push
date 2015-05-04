var util = require("util");

var AbstractError = require("./abstract_error");

util.inherits(InvalidPayloadError, AbstractError);

function InvalidPayloadError(message, parameters) {
  AbstractError.call(this, message, this.constructor);
  this.name       = "InvalidPayloadError";
  this.parameters = parameters;
}

module.exports = InvalidPayloadError;
