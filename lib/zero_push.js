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
  if ( typeof platform === "function" )
    callback = platform;
  if ( typeof  deviceTokens === "function" )
    callback = deviceTokens;
  if ( typeof notification === "function" )
    callback = notification;

  if ( typeof callback !== "function" )
    throw new Error("Missing callback function");

  Endpoints.notify(platform, deviceTokens, notification, callback, this);
};

ZeroPush.prototype.register = function (deviceTokens, channels, callback) {
  if ( typeof  deviceTokens === "function" )
    callback = deviceTokens;
  if ( typeof  channels === "function" )
    callback = channels;

  if ( typeof callback !== "function" )
    throw new Error("Missing callback function");

  Endpoints.register(deviceTokens, channels, callback, this);
};

ZeroPush.prototype.broadcast = function (channel, notification, callback) {
  if ( typeof channel === "function" )
    callback = channel;
  if ( typeof notification === "function" )
    callback = notification;

  if ( typeof callback !== "function" )
    throw new Error("Missing callback function");

  Endpoints.brodcast(channel, notification, callback, this);
};

ZeroPush.prototype.unregister = function (deviceTokens, callback) {
  if ( typeof  deviceTokens === "function" )
    callback = deviceTokens;

  if ( typeof callback !== "function" )
    throw new Error("Missing callback function");

  Endpoints.unregister(deviceTokens, callback, this);
};

ZeroPush.prototype.inactiveTokens = function (since, callback) {
  if ( typeof  since === "function" )
    callback = since;

  if ( typeof callback !== "function" )
    throw new Error("Missing callback function");

  Endpoints.inactiveTokens(since, callback, this);
};

module.exports = ZeroPush;
