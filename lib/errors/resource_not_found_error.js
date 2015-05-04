var util = require("util");

var AbstractError = require("./abstract_error");

util.inherits(ResourceNotFoundError, AbstractError);

function ResourceNotFoundError(message) {
  AbstractError.call(this, message, this.constructor);
  this.name = "ResourceNotFoundError";
}

module.exports = ResourceNotFoundError;
