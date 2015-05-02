var util = require("util");

var AbstractError = require("./abstract_error");

util.inherits(PreconditionFailedError, AbstractError);

function PreconditionFailedError(message) {
  AbstractError.call(this, message, this.constructor);
  this.name = "PreconditionFailedError";
}

module.exports = PreconditionFailedError;
