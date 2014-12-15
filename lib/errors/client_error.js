var util = require("util");

var AbstractError = require("./abstract_error");

util.inherits(ClientError, AbstractError);

function ClientError(name, message, referenceUrl) {
  AbstractError.call(this, message, this.constructor);
  this.name = name;
  this.referenceUrl = referenceUrl;
}

ClientError.getName = function () { return this.name; };

module.exports = ClientError;
