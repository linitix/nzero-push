var util = require("util");

var AbstractError = require("./abstract_error");

var NAME = "ZeroPush Server Error";

util.inherits(ZeroPushServerError, AbstractError);

function ZeroPushServerError(message, body) {
  AbstractError.call(this, message, this.constructor);
  this.name = NAME;
  this.body = body;
}

ZeroPushServerError.getName = function () { return NAME; };

module.exports = ZeroPushServerError;
