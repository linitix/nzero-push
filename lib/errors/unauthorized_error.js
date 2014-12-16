var util = require("util");

var AbstractError = require("./abstract_error");

var NAME = "Unauthorized Error";

util.inherits(UnauthorizedError, AbstractError);

function UnauthorizedError(message) {
  AbstractError.call(this, message, this.constructor);
  this.name = NAME;
}

UnauthorizedError.getName = function () { return NAME; };

module.exports = UnauthorizedError;
