var util = require("util");

var AbstractError = require("./abstract_error");

util.inherits(UndefinedAuthTokenError, AbstractError);

function UndefinedAuthTokenError(message) {
  AbstractError.call(this, message, this.constructor);
  this.name = "UndefinedAuthTokenError";
}

module.exports = UndefinedAuthTokenError;
