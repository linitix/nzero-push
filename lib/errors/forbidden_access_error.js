var util = require("util");

var AbstractError = require("./abstract_error");

util.inherits(ForbiddenAccessError, AbstractError);

function ForbiddenAccessError(message) {
  AbstractError.call(this, message, this.constructor);
  this.name = "ForbiddenAccessError";
}

module.exports = ForbiddenAccessError;
