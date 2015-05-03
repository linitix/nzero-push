var debug      = require("debug")("RequestsManager");
var request    = require("request");
var HTTPStatus = require("http-status");

var Utils = require("./utils");

var UndefinedAuthTokenError = require("../errors/undefined_auth_token_error");
var UnauthorizedAccessError = require("../errors/unauthorized_access_error");
var ForbiddenAccessError    = require("../errors/forbidden_access_error");
var PreconditionFailedError = require("../errors/precondition_failed_error");
var ResourceNotFoundError   = require("../errors/resource_not_found_error");

var BASE_URL     = "https://api.zeropush.com";
var BASE_HEADERS = { "Accept": "application/json", "User-Agent": "request" };

function RequestsManager() {
  this.authToken     = null;
  this.authenticated = null;
  this.deviceQuota   = { quota: null, remaining: null, overage: null };
  this.pushQuota     = { quota: null, remaining: null, overage: null, reset: null };
}

RequestsManager.prototype.setAuthToken = function (authToken) {
  if ( !this.authToken || !authToken ) {
    debug("Set AUTH_TOKEN value to \"" + authToken + "\"");

    this.authToken = authToken;
  }
};

RequestsManager.prototype.getAuthToken = function () {
  return this.authToken;
};

RequestsManager.prototype.getDeviceQuota = function () {
  return this.deviceQuota;
};

RequestsManager.prototype.getPushQuota = function () {
  return this.pushQuota;
};

RequestsManager.prototype.getQuotas = function () {
  return { deviceQuota: this.deviceQuota, pushQuota: this.pushQuota };
};

RequestsManager.prototype.verifyCredentials = function (callback) {
  var self = this;

  if ( !self.authToken )
    return callback(new UndefinedAuthTokenError("AuthToken must be set"));
  if ( typeof self.authenticated === "boolean" && !self.authenticated )
    return callback(new UnauthorizedAccessError("Resource access denied"));
  if ( self.authenticated )
    return callback();

  var requestOptions = {
    url    : BASE_URL + "/verify_credentials?auth_token=" + self.authToken,
    method : "GET",
    headers: BASE_HEADERS,
    json   : true
  };

  debug(requestOptions);

  executeRequest(requestOptions, function (err, body, headers) {
    if ( err )
      return callback(err);

    body.message.toLowerCase() === "authenticated" ? self.authenticated = true : self.authenticated = false;

    callback();
  });
};

RequestsManager.prototype.notify = function (deviceTokens, notification, callback) {
  var self = this;

  if ( typeof self.authenticated === "boolean" && !self.authenticated )
    return callback(new UnauthorizedAccessError("Resource access denied"));

  var requestOptions = {
    url    : BASE_URL + "/notify",
    method : "POST",
    headers: BASE_HEADERS,
    json   : true,
    body   : notification
  };

  requestOptions.headers[ "Content-Type" ] = "application/json";
  requestOptions.body.auth_token           = self.authToken;
  requestOptions.body.device_tokens        = deviceTokens;

  debug(requestOptions);

  executeRequest(requestOptions, function (err, body, headers) {
    if ( err )
      return callback(err);

    getDeviceQuotaFromResponseHeaders(headers, self);
    getPushQuotaFromResponseHeaders(headers, self);

    callback(null, body);
  });
};

RequestsManager.prototype.register = function (deviceToken, channel, callback) {
  var self = this;

  if ( typeof self.authenticated === "boolean" && !self.authenticated )
    return callback(new UnauthorizedAccessError("Resource access denied"));

  var requestOptions = {
    url    : BASE_URL + "/register",
    method : "POST",
    headers: BASE_HEADERS,
    json   : true,
    body   : {}
  };

  requestOptions.headers[ "Content-Type" ] = "application/json";
  requestOptions.body.auth_token           = self.authToken;
  requestOptions.body.device_token         = deviceToken;

  if ( channel )
    requestOptions.body.channel = channel;

  debug(requestOptions);

  executeRequest(requestOptions, function (err, body, headers) {
    if ( err )
      return callback(err);

    getDeviceQuotaFromResponseHeaders(headers, self);
    getPushQuotaFromResponseHeaders(headers, self);

    callback();
  });
};

RequestsManager.prototype.broadcast = function (channel, notification, callback) {
  var self = this;

  if ( typeof self.authenticated === "boolean" && !self.authenticated )
    return callback(new UnauthorizedAccessError("Resource access denied"));

  var requestOptions = {
    url    : BASE_URL + "/broadcast/" + channel,
    method : "POST",
    headers: BASE_HEADERS,
    json   : true,
    body   : notification
  };

  requestOptions.headers[ "Content-Type" ] = "application/json";
  requestOptions.body.auth_token           = self.authToken;

  debug(requestOptions);

  executeRequest(requestOptions, function (err, body, headers) {
    if ( err )
      return callback(err);

    getDeviceQuotaFromResponseHeaders(headers, self);
    getPushQuotaFromResponseHeaders(headers, self);

    callback(null, body);
  });
};

module.exports = RequestsManager;

function executeRequest(requestOptions, callback) {
  debug("Executing request \"" + requestOptions.url + "\" ...");

  request(requestOptions, function (err, res, body) {
    if ( err )
      return callback(err);

    debug("Response body: " + JSON.stringify(body));
    debug("Response headers: " + JSON.stringify(res.headers));

    switch ( res.statusCode ) {
      case HTTPStatus.OK:
        callback(null, body, res.headers);
        break;
      case HTTPStatus.UNAUTHORIZED:
        callback(new UnauthorizedAccessError("Resource access denied"));
        break;
      case HTTPStatus.FORBIDDEN:
        callback(new ForbiddenAccessError(body.message));
        break;
      case HTTPStatus.NOT_FOUND:
        callback(new ResourceNotFoundError("Resource not found"));
        break;
      case HTTPStatus.PRECONDITION_FAILED:
        callback(new PreconditionFailedError(body.message));
        break;
      default:
        callback(new Error("Expected status code " + HTTPStatus.OK + " and received " + res.statusCode));
    }
  });
}

function getDeviceQuotaFromResponseHeaders(headers, self) {
  if ( headers[ Utils.HEADERS.DEVICE_QUOTA ] )
    self.deviceQuota.quota = parseInt(headers[ Utils.HEADERS.DEVICE_QUOTA ]);
  if ( headers[ Utils.HEADERS.DEVICE_QUOTA_REMAINING ] )
    self.deviceQuota.remaining = parseInt(headers[ Utils.HEADERS.DEVICE_QUOTA_REMAINING ]);
  if ( headers[ Utils.HEADERS.DEVICE_QUOTA_OVERAGE ] )
    self.deviceQuota.overage = parseInt(headers[ Utils.HEADERS.DEVICE_QUOTA_OVERAGE ]);
}

function getPushQuotaFromResponseHeaders(headers, self) {
  if ( headers[ Utils.HEADERS.PUSH_QUOTA ] )
    self.pushQuota.quota = parseInt(headers[ Utils.HEADERS.PUSH_QUOTA ]);
  if ( headers[ Utils.HEADERS.PUSH_QUOTA_REMAINING ] )
    self.pushQuota.remaining = parseInt(headers[ Utils.HEADERS.PUSH_QUOTA_REMAINING ]);
  if ( headers[ Utils.HEADERS.PUSH_QUOTA_OVERAGE ] )
    self.pushQuota.overage = parseInt(headers[ Utils.HEADERS.PUSH_QUOTA_OVERAGE ]);
  if ( headers[ Utils.HEADERS.PUSH_QUOTA_RESET ] )
    self.pushQuota.reset = parseInt(headers[ Utils.HEADERS.PUSH_QUOTA_RESET ]);
}
