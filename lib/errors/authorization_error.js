var util = require("util");

var AbstractError = require("./abstract_error");

var NAME = "Authorization Error";

util.inherits(AuthorizationError, AbstractError);

function AuthorizationError(message, referenceUrl) {
  AbstractError.call(this, message, this.constructor);
  this.name = NAME;
  this.referenceUrl = referenceUrl;
}

AuthorizationError.getName = function () { return NAME; };

module.exports = AuthorizationError;
