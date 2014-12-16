var util = require("util");

util.inherits(AbstractError, Error);

function AbstractError(message, ctor) {
  Error.captureStackTrace(this, ctor || this);
  this.message = message || "Error";
}

AbstractError.prototype.name = "Abstract Error";

module.exports = AbstractError;
