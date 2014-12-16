var util = require("util");

var AbstractError = require("./abstract_error");

var NAME = "Quota Error";

util.inherits(QuotaError, AbstractError);

function QuotaError(message, referenceUrl) {
  AbstractError.call(this, message, this.constructor);
  this.name = NAME;
  this.referenceUrl = referenceUrl;
}

QuotaError.getName = function () { return NAME; };

module.exports = QuotaError;
