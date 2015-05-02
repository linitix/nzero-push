var debug = require("debug")("ZeroPush");

var RequestsManager = require("./common/requests_manager");

var Endpoints = require("./endpoints");

function ZeroPush(token) {
  debug("Object initialisation");

  this.requestsManager = new RequestsManager();
  this.requestsManager.setAuthToken(token);

  debug("token: " + this.requestsManager.getAuthToken());

  debug("Object initialised");
}

ZeroPush.prototype.notify = function (platform, deviceTokens, notification, callback) {
  Endpoints.notify(platform, deviceTokens, notification, callback, this);
};

module.exports = ZeroPush;
