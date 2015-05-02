var util = require("util");

var AbstractError = require("./abstract_error");

util.inherits(UnauthorizedAccessError, AbstractError);

function UnauthorizedAccessError(message) {
  AbstractError.call(this, message, this.constructor);
  this.name = "UnauthorizedAccessError";
}

module.exports = UnauthorizedAccessError;
