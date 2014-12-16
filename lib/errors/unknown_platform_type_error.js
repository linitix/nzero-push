var util = require("util");

var AbstractError = require("./abstract_error");

var NAME = "Unknown Platform Type Error";

util.inherits(UnknownPlatformTypeError, AbstractError);

function UnknownPlatformTypeError(message) {
  AbstractError.call(this, message, this.constructor);
  this.name = NAME;
}

UnknownPlatformTypeError.getName = function () { return NAME; };

module.exports = UnknownPlatformTypeError;
