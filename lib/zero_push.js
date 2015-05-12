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

  Endpoints.broadcast(channel, notification, callback, this);
};

ZeroPush.prototype.unregister = function (deviceTokens, callback) {
  if ( typeof  deviceTokens === "function" )
    callback = deviceTokens;

  if ( typeof callback !== "function" )
    throw new Error("Missing callback function");

  Endpoints.unregister(deviceTokens, callback, this);
};

ZeroPush.prototype.inactiveTokens = function (since, callback) {
  if ( typeof  since === "function" ) {
    callback = since;
    since    = 0;
  }

  if ( typeof callback !== "function" )
    throw new Error("Missing callback function");

  Endpoints.inactiveTokens(since, callback, this);
};

ZeroPush.prototype.setBadge = function (deviceTokens, badge, callback) {
  if ( typeof deviceTokens === "function" )
    callback = deviceTokens;
  if ( typeof badge === "function" )
    callback = badge;

  if ( typeof callback !== "function" )
    throw new Error("Missing callback function");

  Endpoints.setBadge(deviceTokens, badge, callback, this);
};

ZeroPush.prototype.channels = function (page, perPage, callback) {
  if ( typeof page === "function" ) {
    callback = page;
    page     = 1;
  }
  if ( typeof perPage === "function" ) {
    callback = perPage;
    perPage  = 25;
  }

  if ( typeof callback !== "function" )
    throw new Error("Missing callback function");

  Endpoints.channels(page, perPage, callback, this);
};

ZeroPush.prototype.channel = function (name, callback) {
  if ( typeof name === "function" )
    callback = name;

  if ( typeof callback !== "function" )
    throw new Error("Missing callback function");

  Endpoints.channel(name, callback, this);
};

ZeroPush.prototype.deleteChannels = function (channels, callback) {
  if ( typeof channels === "function" )
    callback = channels;

  if ( typeof callback !== "function" )
    throw new Error("Missing callback function");

  Endpoints.deleteChannels(channels, callback, this);
};

ZeroPush.prototype.devices = function (page, perPage, callback) {
  if ( typeof page === "function" ) {
    callback = page;
    page     = 1;
  }
  if ( typeof perPage === "function" ) {
    callback = perPage;
    perPage  = 25;
  }

  if ( typeof callback !== "function" )
    throw new Error("Missing callback function");

  Endpoints.devices(page, perPage, callback, this);
};

ZeroPush.prototype.device = function (deviceToken, callback) {
  if ( typeof deviceToken === "function" )
    callback = deviceToken;

  if ( typeof callback !== "function" )
    throw new Error("Missing callback function");

  Endpoints.device(deviceToken, callback, this);
};

ZeroPush.prototype.replaceChannelSubscriptionsForDevices = function (deviceTokens, channels, callback) {
  if ( typeof  deviceTokens === "function" )
    callback = deviceTokens;
  if ( typeof  channels === "function" )
    callback = channels;

  if ( typeof callback !== "function" )
    throw new Error("Missing callback function");

  Endpoints.replaceChannelSubscriptionsForDevices(deviceTokens, channels, callback, this);
};

ZeroPush.prototype.appendToChannelSubscriptionForDevices = function (deviceTokens, channels, callback) {
  if ( typeof  deviceTokens === "function" )
    callback = deviceTokens;
  if ( typeof  channels === "function" )
    callback = channels;

  if ( typeof callback !== "function" )
    throw new Error("Missing callback function");

  Endpoints.appendToChannelSubscriptionForDevices(deviceTokens, channels, callback, this);
};

module.exports = ZeroPush;
