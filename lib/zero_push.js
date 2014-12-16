var util = require("util");

var request = require("request");
var debug = require("debug")("main");
var async = require("async");
var clone = require("clone");
var linksParser = require("parse-link-header");

var AuthorizationError = require("./errors/authorization_error");
var QuotaError = require("./errors/quota_error");
var ZeroPushServerError = require("./errors/zeropush_server_error");
var ConfigurationError = require("./errors/configuration_error");
var ClientError = require("./errors/client_error");
var UnknownPlatformTypeError = require("./errors/unknown_platform_type_error");
var UnauthorizedError = require("./errors/unauthorized_error");

var ENDPOINTS = {
  verify_credentials: "verify_credentials",
  notify            : "notify",
  register          : "register",
  setBadge          : "set_badge",
  inactiveTokens    : "inactive_tokens",
  subscribe         : "subscribe",
  broadcast         : "broadcast",
  devices           : "devices",
  channels          : "channels"
};
var IOS_AND_MAC = "ios-mac";
var SAFARI = "safari";

function ZeroPush(authToken) {
  debug("Object initialisation");

  this.baseURL = "https://api.zeropush.com/";
  this.authToken = authToken;
  this.authenticated = null;
  this.baseRequestOptions = {
    json   : true,
    headers: {
      "Accept"       : "application/json",
      "Content-Type" : "application/json",
      "Authorization": "Token token=\"" + this.authToken + "\""
    }
  };
  this.quota = null;
  this.quotaRemaining = null;
  this.quotaOverage = null;
  this.quotaReset = null;

  debug("baseURL: %s", this.baseURL);
  debug("authToken: %s", this.authToken);
  debug("authenticated: %s", this.authenticated);
  debug("quota: %s", this.quota);
  debug("quotaRemaining: %s", this.quotaRemaining);
  debug("quotaOverage: %s", this.quotaOverage);
  debug("quotaReset: %s", this.quotaReset);
  debug("baseRequestOptions: %s", JSON.stringify(this.baseRequestOptions));
}

/*
 =============================================================================================================
 NOTIFY
 =============================================================================================================
 */

ZeroPush.prototype.notify = function (platform, requiredParams, optionalParams, callback) {
  debug("ENDPOINT: /notify");

  var self = this;

  if (!platform || typeof platform !== "string") {
    return callback(new ClientError("Undefined Platform Error", "You need to specify a platform"));
  }

  if (!requiredParams || typeof requiredParams !== "object") {
    return callback(new ClientError("Undefined Parameters Error", "Undefined required parameters"));
  }

  if (typeof optionalParams === "function") {
    callback = optionalParams;
  } else if (optionalParams && typeof optionalParams !== "object") {
    return callback(new ClientError("Parameter Type Error", "Not an object or function"));
  }

  platform = platform.toLowerCase();

  debug("platform: %s", platform);
  debug("required parameters: %s", JSON.stringify(requiredParams));
  debug("optional parameters: %s", JSON.stringify(optionalParams));

  async.waterfall(
    [
      function (next) {
        self._verifyCredentials(next);
      },
      function (next) {
        if (!self.authenticated) {
          return next(new UnauthorizedError("Unauthorized access"));
        }

        switch (platform) {
          case IOS_AND_MAC:
            typeof optionalParams === "function" ? self._notifyIosAndMacPlatform(requiredParams, next) : self._notifyIosAndMacPlatform(requiredParams, optionalParams, next);
            break;
          case SAFARI:
            typeof optionalParams === "function" ? self._notifySafariPlatform(requiredParams, next) : self._notifySafariPlatform(requiredParams, optionalParams, next);
            break;
          default:
            next(new UnknownPlatformTypeError("Unknown platform type! Please chose between ios-mac or safari!"));
            break;
        }
      }
    ],
    callback
  );
};

ZeroPush.prototype._notifySafariPlatform = function (requiredParams, optionalParams, callback) {
  debug("PRIVATE ENDPOINT: notifySafariPlatform");

  var self = this;
  var requestURL;
  var options;
  var body = {};

  if (typeof optionalParams === "function") {
    callback = optionalParams;
  }

  if (!util.isArray(requiredParams.device_tokens)) {
    return callback(new ClientError("Parameter Type Error", "\"device_tokens\" need to be an array"));
  }

  if (!requiredParams.title || typeof requiredParams.title !== "string") {
    return callback(new ClientError("Parameter Type Error", "\"title\" need to be a string"));
  }

  if (!requiredParams.body || typeof requiredParams.body !== "string") {
    return callback(new ClientError("Parameter Type Error", "\"body\" need to be a string"));
  }

  requestURL = this.baseURL + ENDPOINTS.notify;
  options = clone(this.baseRequestOptions);

  options.method = "POST";
  options.url = requestURL;

  body.device_tokens = requiredParams.device_tokens;
  body.title = requiredParams.title;
  body.body = requiredParams.body;

  if (optionalParams && typeof optionalParams === "object") {
    if (optionalParams.expiry) {
      body.expiry = optionalParams.expiry;
    }

    if (optionalParams.label) {
      body.label = optionalParams.label;
    }

    if (optionalParams.url_args && util.isArray(optionalParams.url_args)) {
      body.url_args = optionalParams.url_args;
    }
  }

  options.body = body;

  debug(options);

  executeRequest(
    options,
    function (err, body, headers) {
      if (err)
        return callback(err);

      self.quota = headers[ "x-push-quota" ];
      self.quotaRemaining = headers[ "x-push-quota-remaining" ];
      self.quotaOverage = headers[ "x-push-quota-overage" ];
      self.quotaReset = headers[ "x-push-quota-reset" ];

      debug("quota: %s", self.quota);
      debug("quotaRemaining: %s", self.quotaRemaining);
      debug("quotaOverage: %s", self.quotaOverage);
      debug("quotaReset: %s", self.quotaReset);

      callback(null, body);
    }
  );
};

ZeroPush.prototype._notifyIosAndMacPlatform = function (requiredParams, optionalParams, callback) {
  debug("PRIVATE ENDPOINT: notifyIosAndMacPlatform");

  var self = this;
  var requestURL;
  var options;
  var body = {};

  if (typeof optionalParams === "function")
    callback = optionalParams;

  if (!util.isArray(requiredParams.device_tokens))
    return callback(new ClientError("Parameter Type Error", "\"device_tokens\" need to be an array"));

  requestURL = this.baseURL + ENDPOINTS.notify;
  options = clone(this.baseRequestOptions);

  options.method = "POST";
  options.url = requestURL;

  body.device_tokens = requiredParams.device_tokens;

  if (optionalParams && typeof optionalParams === "object") {
    if (optionalParams.content_available) {
      body.content_available = optionalParams.content_available;
    }

    if (optionalParams.expiry) {
      body.expiry = optionalParams.expiry;
    }

    if (optionalParams.sound) {
      body.sound = optionalParams.sound;
    }

    if (optionalParams.badge) {
      body.badge = optionalParams.badge;
    }

    if (optionalParams.category) {
      body.category = optionalParams.category;
    }

    if (optionalParams.info) {
      if (typeof optionalParams.info === "object")
        optionalParams.info = JSON.parse(optionalParams.info);

      body.info = optionalParams.info;
    }

    if (optionalParams.alert) {
      body.alert = optionalParams.alert;
    }
  }

  options.body = body;

  debug(options);

  executeRequest(
    options,
    function (err, body, headers) {
      if (err)
        return callback(err);

      self.quota = headers[ "x-push-quota" ];
      self.quotaRemaining = headers[ "x-push-quota-remaining" ];
      self.quotaOverage = headers[ "x-push-quota-overage" ];
      self.quotaReset = headers[ "x-push-quota-reset" ];

      debug("quota: %s", self.quota);
      debug("quotaRemaining: %s", self.quotaRemaining);
      debug("quotaOverage: %s", self.quotaOverage);
      debug("quotaReset: %s", self.quotaReset);

      callback(null, body);
    }
  );
};

/*
 =============================================================================================================
 REGISTER
 =============================================================================================================
 */

ZeroPush.prototype.register = function (requiredParams, optionalParams, callback) {
  debug("ENDPOINT: /register");

  var self = this;

  if (!requiredParams || typeof requiredParams !== "string" || !util.isArray(requiredParams)) {
    return callback(new ClientError("Undefined Parameters Error", "Undefined required parameter"));
  }

  if (typeof optionalParams === "function") {
    callback = optionalParams;
  } else if (optionalParams && typeof optionalParams !== "string" || !util.isArray(optionalParams)) {
    return callback(new ClientError("Undefined Parameters Error", "Undefined optional parameter"));
  }

  async.waterfall(
    [
      function (next) {
        self._verifyCredentials(next);
      },
      function (next) {
        if (!self.authenticated) {
          return next(new UnauthorizedError("Unauthorized"));
        }

        typeof optionalParams === "function" ? self._registerOneDeviceOrMultipleDevices(requiredParams, next) : self._registerOneDeviceOrMultipleDevices(requiredParams, optionalParams, next);
      }
    ],
    callback
  );
};

ZeroPush.prototype._registerOneDeviceOrMultipleDevices = function (requiredParams, optionalParams, callback) {
  debug("PRIVATE ENDPOINT: registerOneDeviceOrMultipleDevices");

  var self = this;

  util.isArray(requiredParams) ? self._registerMultipleDevices(requiredParams, optionalParams, callback) : self._registerDevice(requiredParams, optionalParams, callback);
};

ZeroPush.prototype._registerMultipleDevices = function (devices, channels, callback) {
  debug("PRIVATE ENDPOINT: registerMultipleDevices");

  var self = this;
  var requestURL;
  var options;
  var body = {};
  var responses = {};

  requestURL = this.baseURL + ENDPOINTS.register;
  options = clone(this.baseRequestOptions);

  options.method = "POST";
  options.url = requestURL;

  if (typeof channels === "function") {
    callback = channels;

    return async.each(
      devices,
      function (device, next) {
        body.device_token = device;

        options.body = body;

        debug(options);

        executeRequest(
          options,
          function (err, body, headers) {
            if (err) {
              return next(err);
            }

            self.quota = headers[ "x-push-quota" ];
            self.quotaRemaining = headers[ "x-push-quota-remaining" ];
            self.quotaOverage = headers[ "x-push-quota-overage" ];
            self.quotaReset = headers[ "x-push-quota-reset" ];

            debug("quota: %s", self.quota);
            debug("quotaRemaining: %s", self.quotaRemaining);
            debug("quotaOverage: %s", self.quotaOverage);
            debug("quotaReset: %s", self.quotaReset);

            responses[ device ] = body;

            next();
          }
        );
      },
      function (err) {
        callback(err, responses);
      }
    );
  }

  if (!util.isArray(channels)) {
    return async.each(
      devices,
      function (device, next) {
        body.device_token = device;
        body.channel = channels;

        options.body = body;

        debug(options);

        executeRequest(
          options,
          function (err, body, headers) {
            if (err) {
              return next(err);
            }

            self.quota = headers[ "x-push-quota" ];
            self.quotaRemaining = headers[ "x-push-quota-remaining" ];
            self.quotaOverage = headers[ "x-push-quota-overage" ];
            self.quotaReset = headers[ "x-push-quota-reset" ];

            debug("quota: %s", self.quota);
            debug("quotaRemaining: %s", self.quotaRemaining);
            debug("quotaOverage: %s", self.quotaOverage);
            debug("quotaReset: %s", self.quotaReset);

            responses[ device ] = body;

            next();
          }
        );
      },
      function (err) {
        callback(err, responses);
      }
    );
  }

  async.each(
    devices,
    function (device, next) {
      responses[ device ] = {};

      async.each(
        channels,
        function (channel, next) {
          body.device_token = device;
          body.channel = channel;

          options.body = body;

          debug(options);

          executeRequest(
            options,
            function (err, body, headers) {
              if (err) {
                return next(err);
              }

              self.quota = headers[ "x-push-quota" ];
              self.quotaRemaining = headers[ "x-push-quota-remaining" ];
              self.quotaOverage = headers[ "x-push-quota-overage" ];
              self.quotaReset = headers[ "x-push-quota-reset" ];

              debug("quota: %s", self.quota);
              debug("quotaRemaining: %s", self.quotaRemaining);
              debug("quotaOverage: %s", self.quotaOverage);
              debug("quotaReset: %s", self.quotaReset);

              responses[ device ][ channel ] = body;

              next();
            }
          );
        },
        next
      );
    },
    function (err) {
      callback(err, responses);
    }
  );
};

ZeroPush.prototype._registerDevice = function (device, channels, callback) {
  debug("PRIVATE ENDPOINT: registerDevice");

  var self = this;
  var requestURL;
  var options;
  var body = {};

  requestURL = this.baseURL + ENDPOINTS.register;
  options = clone(this.baseRequestOptions);

  options.method = "POST";
  options.url = requestURL;

  if (typeof channels === "function") {
    callback = channels;

    body.device_token = device;

    options.body = body;

    debug(options);

    return executeRequest(
      options,
      function (err, body, headers) {
        if (err) {
          return callback(err);
        }

        self.quota = headers[ "x-push-quota" ];
        self.quotaRemaining = headers[ "x-push-quota-remaining" ];
        self.quotaOverage = headers[ "x-push-quota-overage" ];
        self.quotaReset = headers[ "x-push-quota-reset" ];

        debug("quota: %s", self.quota);
        debug("quotaRemaining: %s", self.quotaRemaining);
        debug("quotaOverage: %s", self.quotaOverage);
        debug("quotaReset: %s", self.quotaReset);

        callback(null, body);
      }
    );
  }

  if (!util.isArray(channels)) {
    body.device_token = device;
    body.channel = channels;

    options.body = body;

    debug(options);

    return executeRequest(
      options,
      function (err, body, headers) {
        if (err) {
          return callback(err);
        }

        self.quota = headers[ "x-push-quota" ];
        self.quotaRemaining = headers[ "x-push-quota-remaining" ];
        self.quotaOverage = headers[ "x-push-quota-overage" ];
        self.quotaReset = headers[ "x-push-quota-reset" ];

        debug("quota: %s", self.quota);
        debug("quotaRemaining: %s", self.quotaRemaining);
        debug("quotaOverage: %s", self.quotaOverage);
        debug("quotaReset: %s", self.quotaReset);

        callback(null, body);
      }
    );
  }

  var responses = {};

  async.each(
    channels,
    function (channel, next) {
      body.device_token = device;
      body.channel = channel;

      options.body = body;

      debug(options);

      executeRequest(
        options,
        function (err, body, headers) {
          if (err) {
            return next(err);
          }

          self.quota = headers[ "x-push-quota" ];
          self.quotaRemaining = headers[ "x-push-quota-remaining" ];
          self.quotaOverage = headers[ "x-push-quota-overage" ];
          self.quotaReset = headers[ "x-push-quota-reset" ];

          debug("quota: %s", self.quota);
          debug("quotaRemaining: %s", self.quotaRemaining);
          debug("quotaOverage: %s", self.quotaOverage);
          debug("quotaReset: %s", self.quotaReset);

          responses[ channel ] = body;

          next();
        }
      );
    },
    function (err) {
      callback(err, responses);
    }
  );
};

/*
 =============================================================================================================
 UNREGISTER
 =============================================================================================================
 */

ZeroPush.prototype.unregister = function (requiredParams, callback) {
  debug("ENDPOINT: /unregister");

  var self = this;

  if (!requiredParams || typeof requiredParams !== "string" || !util.isArray(requiredParams)) {
    return callback(new ClientError("Undefined Parameters Error", "Undefined required parameter"));
  }

  async.waterfall(
    [
      function (next) {
        self._verifyCredentials(next);
      },
      function (next) {
        if (!self.authenticated) {
          return next(new UnauthorizedError("Unauthorized"));
        }

        self._unregisterOneDeviceOrMultipleDevices(requiredParams, next);
      }
    ],
    callback
  );
};

ZeroPush.prototype._unregisterOneDeviceOrMultipleDevices = function (requiredParams, callback) {
  debug("PRIVATE ENDPOINT: unregisterOneDeviceOrMultipleDevices");

  var self = this;

  util.isArray(requiredParams) ? self._unregisterMultipleDevices(requiredParams, callback) : self._unregisterDevice(requiredParams, callback);
};

ZeroPush.prototype._unregisterMultipleDevices = function (devices, callback) {
  debug("PRIVATE ENDPOINT: unregisterMultipleDevices");

  var self = this;
  var requestURL;
  var options;
  var body = {};

  requestURL = this.baseURL + ENDPOINTS.register;
  options = clone(this.baseRequestOptions);

  options.method = "DELETE";
  options.url = requestURL;

  var responses = {};

  async.each(
    devices,
    function (device, next) {
      body.device_token = device;

      options.body = body;

      debug(options);

      executeRequest(
        options,
        function (err, body, headers) {
          if (err) {
            return next(err);
          }

          self.quota = headers[ "x-push-quota" ];
          self.quotaRemaining = headers[ "x-push-quota-remaining" ];
          self.quotaOverage = headers[ "x-push-quota-overage" ];

          debug("quota: %s", self.quota);
          debug("quotaRemaining: %s", self.quotaRemaining);
          debug("quotaOverage: %s", self.quotaOverage);

          responses[ device ] = body;

          next();
        }
      );
    },
    function (err) {
      callback(err, responses);
    }
  );
};

ZeroPush.prototype._unregisterDevice = function (device, callback) {
  debug("PRIVATE ENDPOINT: unregisterDevice");

  var self = this;
  var requestURL;
  var options;
  var body = {};

  requestURL = this.baseURL + ENDPOINTS.register;
  options = clone(this.baseRequestOptions);

  options.method = "DELETE";
  options.url = requestURL;

  body.device_token = device;

  options.body = body;

  debug(options);

  executeRequest(
    options,
    function (err, body, headers) {
      if (err) {
        return callback(err);
      }

      self.quota = headers[ "x-push-quota" ];
      self.quotaRemaining = headers[ "x-push-quota-remaining" ];
      self.quotaOverage = headers[ "x-push-quota-overage" ];

      debug("quota: %s", self.quota);
      debug("quotaRemaining: %s", self.quotaRemaining);
      debug("quotaOverage: %s", self.quotaOverage);

      callback(null, body);
    }
  );
};

/*
 =============================================================================================================
 INACTIVE TOKENS
 =============================================================================================================
 */

ZeroPush.prototype.inactiveTokens = function (callback) {
  debug("ENDPOINT: /inactive_tokens");

  var self = this;

  async.waterfall(
    [
      function (next) {
        self._verifyCredentials(next);
      },
      function (next) {
        if (!self.authenticated) {
          return next(new UnauthorizedError("Unauthorized"));
        }

        self._retrieveInactiveTokens(next);
      }
    ],
    callback
  );
};

ZeroPush.prototype._retrieveInactiveTokens = function (callback) {
  debug("PRIVATE ENDPOINT: retrieveInactiveTokens");

  var requestURL;
  var options;

  requestURL = this.baseURL + ENDPOINTS.inactiveTokens;
  options = clone(this.baseRequestOptions);

  options.method = "GET";
  options.url = requestURL;

  debug(options);

  executeRequest(
    options,
    function (err, body) {
      err ? callback(err) : callback(null, body);
    }
  );
};

/*
 =============================================================================================================
 SET BADGE
 =============================================================================================================
 */

ZeroPush.prototype.setBadge = function (requiredParams, callback) {
  debug("ENDPOINT: /set_badge");

  var self = this;

  if (!requiredParams || typeof requiredParams !== "object") {
    return callback(new ClientError("Undefined Parameters Error", "Undefined required parameters"));
  }

  debug("required parameters: %s", JSON.stringify(requiredParams));

  async.waterfall(
    [
      function (next) {
        self._verifyCredentials(next);
      },
      function (next) {
        if (!self.authenticated) {
          return next(new UnauthorizedError("Unauthorized"));
        }

        self._setBadgeForOneOrMultipleDevices(requiredParams, next);
      }
    ],
    callback
  );
};

ZeroPush.prototype._setBadgeForOneOrMultipleDevices = function (requiredParams, callback) {
  debug("PRIVATE ENDPOINT: setBadgeForOneOrMultipleDevices");

  var self = this;

  util.isArray(requiredParams.device_token) ? self._setBadgeForMultipleDevices(requiredParams, callback) : self._setBadgeForOneDevice(requiredParams, callback);
};

ZeroPush.prototype._setBadgeForMultipleDevices = function (requiredParams, callback) {
  debug("PRIVATE ENDPOINT: setBadgeForMultipleDevices");

  var requestURL;
  var options;
  var body = {};
  var responses = {};

  requestURL = this.baseURL + ENDPOINTS.setBadge;
  options = clone(this.baseRequestOptions);

  options.method = "POST";
  options.url = requestURL;

  async.each(
    requiredParams.device_token,
    function (device, next) {
      body.device_token = device;
      body.badge = requiredParams.badge;

      options.body = body;

      debug(options);

      executeRequest(
        options,
        function (err, body) {
          if (err) {
            return next(err);
          }

          responses[ device ] = body;

          next();
        }
      );
    },
    function (err) {
      callback(err, responses);
    }
  );
};

ZeroPush.prototype._setBadgeForOneDevice = function (requiredParams, callback) {
  debug("PRIVATE ENDPOINT: setBadgeForOneDevice");

  var requestURL;
  var options;
  var body = {};

  requestURL = this.baseURL + ENDPOINTS.setBadge;
  options = clone(this.baseRequestOptions);

  options.method = "POST";
  options.url = requestURL;

  body.device_token = requiredParams.device_token;
  body.badge = requiredParams.badge;

  options.body = body;

  debug(options);

  executeRequest(
    options,
    function (err, body) {
      err ? callback(err) : callback(null, body);
    }
  );
};

/*
 =============================================================================================================
 SUBSCRIBE
 =============================================================================================================
 */

ZeroPush.prototype.subscribe = function (requiredParams, callback) {
  debug("ENDPOINT: /subscribe");

  var self = this;

  if (!requiredParams || typeof requiredParams !== "object") {
    return callback(new ClientError("Undefined Parameters Error", "Undefined required parameters"));
  }

  debug("required parameters: %s", JSON.stringify(requiredParams));

  async.waterfall(
    [
      function (next) {
        self._verifyCredentials(next);
      },
      function (next) {
        if (!self.authenticated) {
          return next(new UnauthorizedError("Unauthorized"));
        }

        self._subscribeOneDeviceOrMultipleDevicesInOneOrMultipleChannels(requiredParams, next);
      }
    ],
    callback
  );
};

ZeroPush.prototype._subscribeOneDeviceOrMultipleDevicesInOneOrMultipleChannels = function (requiredParams, callback) {
  debug("PRIVATE ENDPOINT: subscribeOneDeviceOrMultipleDevicesInOneOrMultipleChannels");

  var self = this;

  util.isArray(requiredParams.device_token) ? self._subscribeDevices(requiredParams, callback) : self._subscribeDevice(requiredParams, callback);
};

ZeroPush.prototype._subscribeDevices = function (requiredParams, callback) {
  debug("PRIVATE ENDPOINT: subscribeDevices");

  var self = this;
  var requestURL;
  var options;
  var body = {};
  var responses = {};

  options = clone(this.baseRequestOptions);

  options.method = "POST";

  if (!util.isArray(requiredParams.channel)) {
    requestURL = self.baseURL + ENDPOINTS.subscribe + "/" + requiredParams.channel;

    options.url = requestURL;

    return async.each(
      requiredParams.device_token,
      function (device, next) {
        body.device_token = device;

        options.body = body;

        debug(options);

        executeRequest(
          options,
          function (err, body) {
            if (err) {
              return next(err);
            }

            responses[ device ] = body.channels;

            next();
          }
        );
      },
      function (err) {
        callback(err, responses);
      }
    );
  }

  async.each(
    requiredParams.device_token,
    function (device, next) {
      body.device_token = device;

      async.each(
        requiredParams.channel,
        function (channel, next) {
          requestURL = self.baseURL + ENDPOINTS.subscribe + "/" + channel;

          options.url = requestURL;
          options.body = body;

          debug(options);

          executeRequest(
            options,
            function (err, body) {
              if (err) {
                return next(err);
              }

              responses[ device ] = body.channels;

              next();
            }
          );
        },
        next
      );
    },
    function (err) {
      callback(err, responses);
    }
  );
};

ZeroPush.prototype._subscribeDevice = function (requiredParams, callback) {
  debug("PRIVATE ENDPOINT: subscribeDevice");

  var self = this;
  var requestURL;
  var options;
  var body = {};
  var responses = {};

  options = clone(this.baseRequestOptions);

  options.method = "POST";

  body.device_token = requiredParams.device_token;

  if (!util.isArray(requiredParams.channel)) {
    requestURL = self.baseURL + ENDPOINTS.subscribe + "/" + requiredParams.channel;

    options.url = requestURL;
    options.body = body;

    debug(options);

    return executeRequest(
      options,
      function (err, body) {
        err ? callback(err) : callback(null, body);
      }
    );
  }

  async.each(
    requiredParams.channel,
    function (channel, next) {
      requestURL = self.baseURL + ENDPOINTS.subscribe + "/" + channel;

      options.url = requestURL;
      options.body = body;

      debug(options);

      executeRequest(
        options,
        function (err, body) {
          if (err) {
            return next(err);
          }

          responses[ channel ] = body;

          next();
        }
      );
    },
    function (err) {
      callback(err, responses);
    }
  );
};

/*
 =============================================================================================================
 UNSUBSCRIBE
 =============================================================================================================
 */

ZeroPush.prototype.unsubscribe = function (requiredParams, callback) {
  debug("ENDPOINT: /unsubscribe");

  var self = this;

  if (!requiredParams || typeof requiredParams !== "object") {
    return callback(new ClientError("Undefined Parameters Error", "Undefined required parameters"));
  }

  debug("required parameters: %s", JSON.stringify(requiredParams));

  async.waterfall(
    [
      function (next) {
        self._verifyCredentials(next);
      },
      function (next) {
        if (!self.authenticated) {
          return next(new UnauthorizedError("Unauthorized"));
        }

        self._unsubscribeOneDeviceOrMultipleDevicesInOneOrMultipleChannels(requiredParams, next);
      }
    ],
    callback
  );
};

ZeroPush.prototype._unsubscribeOneDeviceOrMultipleDevicesInOneOrMultipleChannels = function (requiredParams, callback) {
  debug("PRIVATE ENDPOINT: unsubscribeOneDeviceOrMultipleDevicesInOneOrMultipleChannels");

  var self = this;

  util.isArray(requiredParams.device_token) ? self._unsubscribeDevices(requiredParams, callback) : self._unsubscribeDevice(requiredParams, callback);
};

ZeroPush.prototype._unsubscribeDevices = function (requiredParams, callback) {
  debug("PRIVATE ENDPOINT: unsubscribeDevices");

  var self = this;
  var requestURL;
  var options;
  var body = {};
  var responses = {};

  options = clone(this.baseRequestOptions);

  options.method = "DELETE";

  if (!util.isArray(requiredParams.channel)) {
    requestURL = self.baseURL + ENDPOINTS.subscribe + "/" + requiredParams.channel;

    options.url = requestURL;

    return async.each(
      requiredParams.device_token,
      function (device, next) {
        body.device_token = device;

        options.body = body;

        debug(options);

        executeRequest(
          options,
          function (err, body) {
            if (err) {
              return next(err);
            }

            responses[ device ] = body.channels;

            next();
          }
        );
      },
      function (err) {
        callback(err, responses);
      }
    );
  }

  async.each(
    requiredParams.device_token,
    function (device, next) {
      body.device_token = device;

      async.each(
        requiredParams.channel,
        function (channel, next) {
          requestURL = self.baseURL + ENDPOINTS.subscribe + "/" + channel;

          options.url = requestURL;
          options.body = body;

          debug(options);

          executeRequest(
            options,
            function (err, body) {
              if (err) {
                return next(err);
              }

              responses[ device ] = body.channels;

              next();
            }
          );
        },
        next
      );
    },
    function (err) {
      callback(err, responses);
    }
  );
};

ZeroPush.prototype._unsubscribeDevice = function (requiredParams, callback) {
  debug("PRIVATE ENDPOINT: unsubscribeDevice");

  var self = this;
  var requestURL;
  var options;
  var body = {};
  var responses = {};

  options = clone(this.baseRequestOptions);

  options.method = "DELETE";

  body.device_token = requiredParams.device_token;

  if (!util.isArray(requiredParams.channel)) {
    requestURL = self.baseURL + ENDPOINTS.subscribe + "/" + requiredParams.channel;

    options.url = requestURL;
    options.body = body;

    debug(options);

    return executeRequest(
      options,
      function (err, body) {
        err ? callback(err) : callback(null, body);
      }
    );
  }

  async.each(
    requiredParams.channel,
    function (channel, next) {
      requestURL = self.baseURL + ENDPOINTS.subscribe + "/" + channel;

      options.url = requestURL;
      options.body = body;

      debug(options);

      executeRequest(
        options,
        function (err, body) {
          if (err) {
            return next(err);
          }

          responses[ channel ] = body;

          next();
        }
      );
    },
    function (err) {
      callback(err, responses);
    }
  );
};

/*
 =============================================================================================================
 BROADCAST
 =============================================================================================================
 */

ZeroPush.prototype.broadcast = function (platform, requiredParams, optionalParams, callback) {
  debug("ENDPOINT: /broadcast/[channel]");

  var self = this;

  if (!platform || typeof platform !== "string") {
    return callback(new ClientError("Undefined Platform Error", "You need to specify a platform"));
  }

  if (!requiredParams || typeof requiredParams !== "object") {
    return callback(new ClientError("Undefined Parameters Error", "Undefined required parameters"));
  }

  if (typeof optionalParams === "function") {
    callback = optionalParams;
  } else if (optionalParams && typeof optionalParams !== "object") {
    return callback(new ClientError("Parameter Type Error", "Not an object or function"));
  }

  platform = platform.toLowerCase();

  debug("platform: %s", platform);
  debug("required parameters: %s", JSON.stringify(requiredParams));
  debug("optional parameters: %s", JSON.stringify(optionalParams));

  async.waterfall(
    [
      function (next) {
        self._verifyCredentials(next);
      },
      function (next) {
        if (!self.authenticated) {
          return next(new UnauthorizedError("Unauthorized"));
        }

        switch (platform) {
          case IOS_AND_MAC:
            typeof optionalParams === "function" ? self._broadcastIosAndMacPlatform(requiredParams, next) : self._broadcastIosAndMacPlatform(requiredParams, optionalParams, next);
            break;
          case SAFARI:
            typeof optionalParams === "function" ? self._broadcastSafariPlatform(requiredParams, next) : self._broadcastSafariPlatform(requiredParams, optionalParams, next);
            break;
          default:
            next(new UnknownPlatformTypeError("Unknown platform type! Please chose between ios-mac or safari!"));
            break;
        }
      }
    ],
    callback
  );
};

ZeroPush.prototype._broadcastIosAndMacPlatform = function (requiredParams, optionalParams, callback) {
  debug("PRIVATE ENDPOINT: broadcastIosAndMacPlatform");

  var self = this;
  var requestURL;
  var options;
  var body = {};
  var responses = {};

  if (typeof optionalParams === "function") {
    callback = optionalParams;
  }

  requestURL = this.baseURL + ENDPOINTS.broadcast;
  options = clone(this.baseRequestOptions);

  options.method = "POST";
  options.url = requestURL;

  if (optionalParams && typeof optionalParams === "object") {
    if (optionalParams.content_available) {
      body.content_available = optionalParams.content_available;
    }

    if (optionalParams.expiry) {
      body.expiry = optionalParams.expiry;
    }

    if (optionalParams.sound) {
      body.sound = optionalParams.sound;
    }

    if (optionalParams.badge) {
      body.badge = optionalParams.badge;
    }

    if (optionalParams.category) {
      body.category = optionalParams.category;
    }

    if (optionalParams.info) {
      if (typeof optionalParams.info === "object")
        optionalParams.info = JSON.parse(optionalParams.info);

      body.info = optionalParams.info;
    }

    if (optionalParams.alert) {
      body.alert = optionalParams.alert;
    }
  }

  options.body = body;

  if (typeof optionalParams === "object" && optionalParams.channel && !util.isArray(optionalParams.channel)) {
    requestURL = self.baseURL + ENDPOINTS.broadcast + "/" + optionalParams.channel;

    options.url = requestURL;

    debug(options);

    return executeRequest(
      options,
      function (err, body, headers) {
        if (err) {
          return callback(err);
        }

        self.quota = headers[ "x-push-quota" ];
        self.quotaRemaining = headers[ "x-push-quota-remaining" ];
        self.quotaOverage = headers[ "x-push-quota-overage" ];
        self.quotaReset = headers[ "x-push-quota-reset" ];

        debug("quota: %s", self.quota);
        debug("quotaRemaining: %s", self.quotaRemaining);
        debug("quotaOverage: %s", self.quotaOverage);
        debug("quotaReset: %s", self.quotaReset);

        callback(null, body);
      }
    );
  }

  if (typeof optionalParams === "object" && optionalParams.channel && util.isArray(optionalParams.channel)) {
    return async.each(
      optionalParams.channel,
      function (channel, next) {
        requestURL = self.baseURL + ENDPOINTS.broadcast + "/" + channel;

        options.url = requestURL;

        debug(options);

        executeRequest(
          options,
          function (err, body, headers) {
            if (err) {
              return callback(err);
            }

            self.quota = headers[ "x-push-quota" ];
            self.quotaRemaining = headers[ "x-push-quota-remaining" ];
            self.quotaOverage = headers[ "x-push-quota-overage" ];
            self.quotaReset = headers[ "x-push-quota-reset" ];

            debug("quota: %s", self.quota);
            debug("quotaRemaining: %s", self.quotaRemaining);
            debug("quotaOverage: %s", self.quotaOverage);
            debug("quotaReset: %s", self.quotaReset);

            responses[ channel ] = body;

            next();
          }
        );
      },
      function (err) {
        err ? callback(err) : callback(null, responses);
      }
    );
  }

  requestURL = self.baseURL + ENDPOINTS.broadcast;

  options.url = requestURL;

  debug(options);

  executeRequest(
    options,
    function (err, body, headers) {
      if (err) {
        return callback(err);
      }

      self.quota = headers[ "x-push-quota" ];
      self.quotaRemaining = headers[ "x-push-quota-remaining" ];
      self.quotaOverage = headers[ "x-push-quota-overage" ];
      self.quotaReset = headers[ "x-push-quota-reset" ];

      debug("quota: %s", self.quota);
      debug("quotaRemaining: %s", self.quotaRemaining);
      debug("quotaOverage: %s", self.quotaOverage);
      debug("quotaReset: %s", self.quotaReset);

      callback(null, body);
    }
  );
};

ZeroPush.prototype._broadcastSafariPlatform = function (requiredParams, optionalParams, callback) {
  debug("PRIVATE ENDPOINT: broadcastSafariPlatform");

  var self = this;
  var requestURL;
  var options;
  var body = {};
  var responses = {};

  if (typeof optionalParams === "function") {
    callback = optionalParams;
  }

  if (!requiredParams.title || typeof requiredParams.title !== "string") {
    return callback(new ClientError("Parameter Type Error", "\"title\" need to be a string"));
  }

  if (!requiredParams.body || typeof requiredParams.body !== "string") {
    return callback(new ClientError("Parameter Type Error", "\"body\" need to be a string"));
  }

  options = clone(self.baseRequestOptions);

  options.method = "POST";

  body.title = requiredParams.title;
  body.body = requiredParams.body;

  if (optionalParams && typeof optionalParams === "object") {
    if (optionalParams.expiry) {
      body.expiry = optionalParams.expiry;
    }

    if (optionalParams.label) {
      body.label = optionalParams.label;
    }

    if (optionalParams.url_args && util.isArray(optionalParams.url_args)) {
      body.url_args = optionalParams.url_args;
    }
  }

  options.body = body;

  if (typeof optionalParams === "object" && optionalParams.channel && !util.isArray(optionalParams.channel)) {
    requestURL = self.baseURL + ENDPOINTS.broadcast + "/" + optionalParams.channel;

    options.url = requestURL;

    debug(options);

    return executeRequest(
      options,
      function (err, body, headers) {
        if (err) {
          return callback(err);
        }

        self.quota = headers[ "x-push-quota" ];
        self.quotaRemaining = headers[ "x-push-quota-remaining" ];
        self.quotaOverage = headers[ "x-push-quota-overage" ];
        self.quotaReset = headers[ "x-push-quota-reset" ];

        debug("quota: %s", self.quota);
        debug("quotaRemaining: %s", self.quotaRemaining);
        debug("quotaOverage: %s", self.quotaOverage);
        debug("quotaReset: %s", self.quotaReset);

        callback(null, body);
      }
    );
  }

  if (typeof optionalParams === "object" && optionalParams.channel && util.isArray(optionalParams.channel)) {
    return async.each(
      optionalParams.channel,
      function (channel, next) {
        requestURL = self.baseURL + ENDPOINTS.broadcast + "/" + channel;

        options.url = requestURL;

        debug(options);

        executeRequest(
          options,
          function (err, body, headers) {
            if (err) {
              return callback(err);
            }

            self.quota = headers[ "x-push-quota" ];
            self.quotaRemaining = headers[ "x-push-quota-remaining" ];
            self.quotaOverage = headers[ "x-push-quota-overage" ];
            self.quotaReset = headers[ "x-push-quota-reset" ];

            debug("quota: %s", self.quota);
            debug("quotaRemaining: %s", self.quotaRemaining);
            debug("quotaOverage: %s", self.quotaOverage);
            debug("quotaReset: %s", self.quotaReset);

            responses[ channel ] = body;

            next();
          }
        );
      },
      function (err) {
        err ? callback(err) : callback(null, responses);
      }
    );
  }

  requestURL = self.baseURL + ENDPOINTS.broadcast;

  options.url = requestURL;

  debug(options);

  executeRequest(
    options,
    function (err, body, headers) {
      if (err) {
        return callback(err);
      }

      self.quota = headers[ "x-push-quota" ];
      self.quotaRemaining = headers[ "x-push-quota-remaining" ];
      self.quotaOverage = headers[ "x-push-quota-overage" ];
      self.quotaReset = headers[ "x-push-quota-reset" ];

      debug("quota: %s", self.quota);
      debug("quotaRemaining: %s", self.quotaRemaining);
      debug("quotaOverage: %s", self.quotaOverage);
      debug("quotaReset: %s", self.quotaReset);

      callback(null, body);
    }
  );
};

/*
 =============================================================================================================
 VERIFY CREDENTIALS
 =============================================================================================================
 */

ZeroPush.prototype._verifyCredentials = function (callback) {
  debug("PRIVATE ENDPOINT: verifyCredentials");

  var self = this;
  var requestURL;
  var options;

  if (self.authenticated) {
    return callback();
  }

  requestURL = this.baseURL + ENDPOINTS.verify_credentials;
  options = clone(this.baseRequestOptions);

  options.method = "GET";
  options.url = requestURL;

  debug("request URL: " + requestURL);
  debug("request options: " + JSON.stringify(options));

  executeRequest(
    options,
    function (err, body) {
      if (err) {
        return callback(err);
      }

      body.message === "authenticated" ? self.authenticated = true : self.authenticated = false;

      debug("Verify credentials response: " + JSON.stringify(body));

      callback();
    }
  );
};

/*
 =============================================================================================================
 DEVICES
 =============================================================================================================
 */

ZeroPush.prototype.retrieveSetOfRegisteredDevices = function (page, devicesPerPage, callback) {
  debug("ENDPOINT: GET /devices");

  var self = this;
  var requestURL = self.baseURL + ENDPOINTS.devices;
  var options = clone(self.baseRequestOptions);
  var requestUrlModified = false;

  if (typeof page === "function") {
    callback = page;
  } else if (typeof devicesPerPage === "function") {
    callback = devicesPerPage;
  }

  if (typeof page === "number" && page >= 0) {
    requestURL += "?page=" + page;
    requestUrlModified = true;
  }

  if (typeof devicesPerPage === "number" && devicesPerPage >= 1) {
    requestUrlModified ? requestURL += "&per_page=" + devicesPerPage : requestURL += "?per_page=" + devicesPerPage;
  }

  options.method = "GET";
  options.url = requestURL;

  debug(options);

  executeRequest(
    options,
    function (err, body, headers) {
      if (err) {
        return callback(err);
      }

      var response = {
        devices   : body,
        total     : headers.total || headers.Total,
        pagination: linksParser(headers.link)
      };

      callback(null, response);
    }
  );
};

ZeroPush.prototype.retrieveDeviceDetails = function (deviceToken, callback) {
  debug("ENDPOINT: GET /devices/{device_token}");

  var self = this;
  var requestURL;
  var options;

  if (typeof deviceToken === "function") {
    callback = deviceToken;
    return callback(new ClientError("Parameter Type Error", "\"deviceToken\" need to be a string"));
  }

  if (typeof deviceToken !== "string") {
    return callback(new ClientError("Parameter Type Error", "\"deviceToken\" need to be a string"));
  }

  debug("device_token: " + deviceToken);

  options = clone(self.baseRequestOptions);

  options.method = "GET";
  requestURL = self.baseURL + ENDPOINTS.devices + "/" + deviceToken;
  options.url = requestURL;

  debug(options);

  executeRequest(
    options,
    function (err, body) {
      err ? callback(err) : callback(null, body);
    }
  );
};

ZeroPush.prototype.replaceDeviceChannelSubscriptions = function (deviceToken, channels, callback) {
  debug("ENDPOINT: PUT /devices/{device_token}");

  var self = this;
  var requestURL;
  var options;
  var body = {};

  if (typeof deviceToken === "function") {
    callback = deviceToken;
    return callback(new ClientError("Parameter Type Error", "\"deviceToken\" need to be a string"));
  }

  if (typeof deviceToken !== "string") {
    return callback(new ClientError("Parameter Type Error", "\"deviceToken\" need to be a string"));
  }

  if (typeof channels === "function") {
    callback = channels;
    return callback(new ClientError("Parameter Type Error", "\"channels\" need to be an array of string"));
  }

  if (!util.isArray(channels)) {
    return callback(new ClientError("Parameter Type Error", "\"channels\" need to be an array of string"));
  }

  debug("device_token: " + deviceToken);
  debug("channels: " + JSON.stringify(channels));

  options = clone(self.baseRequestOptions);

  requestURL = self.baseURL + ENDPOINTS.devices + "/" + deviceToken;
  body.channel_list = channels.join(",");

  options.method = "PUT";
  options.url = requestURL;

  debug(options);

  executeRequest(
    options,
    function (err, body) {
      err ? callback(err) : callback(null, body);
    }
  );
};

ZeroPush.prototype.appendDeviceChannelSubscriptions = function (deviceToken, channels, callback) {
  debug("ENDPOINT: PATCH /devices/{device_token}");

  var self = this;
  var requestURL;
  var options;
  var body = {};

  if (typeof deviceToken === "function") {
    callback = deviceToken;
    return callback(new ClientError("Parameter Type Error", "\"deviceToken\" need to be a string"));
  }

  if (typeof deviceToken !== "string") {
    return callback(new ClientError("Parameter Type Error", "\"deviceToken\" need to be a string"));
  }

  if (typeof channels === "function") {
    callback = channels;
    return callback(new ClientError("Parameter Type Error", "\"channels\" need to be an array of string"));
  }

  if (!util.isArray(channels)) {
    return callback(new ClientError("Parameter Type Error", "\"channels\" need to be an array of string"));
  }

  debug("device_token: " + deviceToken);
  debug("channels: " + JSON.stringify(channels));

  options = clone(self.baseRequestOptions);

  requestURL = self.baseURL + ENDPOINTS.devices + "/" + deviceToken;
  body.channel_list = channels.join(",");

  options.method = "PATCH";
  options.url = requestURL;

  debug(options);

  executeRequest(
    options,
    function (err, body) {
      err ? callback(err) : callback(null, body);
    }
  );
};

/*
 =============================================================================================================
 CHANNELS
 =============================================================================================================
 */

ZeroPush.prototype.retrieveSetOfChannels = function () {};

ZeroPush.prototype.retrieveChannelDetails = function (channel, callback) {
  debug("ENDPOINT: GET /channels/{channel_name}");

  var self = this;
  var requestURL;
  var options;

  if (typeof channel === "function") {
    callback = channel;
    return callback(new ClientError("Parameter Type Error", "\"channel\" need to be a string"));
  }

  if (typeof channel !== "string") {
    return callback(new ClientError("Parameter Type Error", "\"channel\" need to be a string"));
  }

  debug("channel_name: " + channel);

  options = clone(self.baseRequestOptions);

  options.method = "GET";
  requestURL = self.baseURL + ENDPOINTS.channels + "/" + channel;
  options.url = requestURL;

  debug(options);

  executeRequest(
    options,
    function (err, body) {
      err ? callback(err) : callback(null, body);
    }
  );
};

ZeroPush.prototype.deleteChannel = function (channel, callback) {
  debug("ENDPOINT: DELETE /channels/{channel_name}");

  var self = this;
  var requestURL;
  var options;

  if (typeof channel === "function") {
    callback = channel;
    return callback(new ClientError("Parameter Type Error", "\"channel\" need to be a string"));
  }

  if (typeof channel !== "string") {
    return callback(new ClientError("Parameter Type Error", "\"channel\" need to be a string"));
  }

  debug("channel_name: " + channel);

  options = clone(self.baseRequestOptions);

  options.method = "DELETE";
  requestURL = self.baseURL + ENDPOINTS.channels + "/" + channel;
  options.url = requestURL;

  debug(options);

  executeRequest(
    options,
    function (err, body) {
      err ? callback(err) : callback(null, body);
    }
  );
};

module.exports = ZeroPush;

function executeRequest(options, callback) {
  debug("Executing request ...");

  request(
    options,
    function (err, res, body) {
      if (err) {
        return callback(err);
      }

      if (res.statusCode >= 500) {
        return callback(new ZeroPushServerError("ZeroPush server currently has problems. Try later.", body));
      }

      if (!body.error) {
        return callback(null, body, res.headers);
      }

      switch (body.error.toLowerCase()) {
        case "authorization error":
          callback(new AuthorizationError(body.message, body.reference_url));
          break;
        case "quota error":
          callback(new QuotaError(body.message, body.reference_url));
          break;
        case "configuration error":
          callback(new ConfigurationError(body.message, body.reference_url));
          break;
        default:
          callback(new ClientError(body.error.toLowerCase(), body.message, body.reference_url));
          break;
      }
    }
  );
}
