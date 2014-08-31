var util = require("util");

var request = require("request");
var debug = require("debug")("main");
var async = require("async");
var HTTPStatus = require("http-status");
var clone = require("clone");

var ENDPOINTS = {
    verify_credentials: "verify_credentials",
    notify: "notify",
    register: "register",
    unregister: "unregister",
    setBadge: "set_badge",
    inactiveTokens: "inactive_tokens"
};
var IOS_AND_MAC = "ios-mac";
var SAFARI = "safari";

function ZeroPush(authToken) {
    debug("Object initialisation");

    this.baseURL = "https://api.zeropush.com/";
    this.authToken = "auth_token=" + authToken;
    this.authenticated = null;
    this.baseRequestOptions = {
        headers: {
            accept: "application/json"
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

ZeroPush.prototype.notify = function (platform, requiredParams, optionalParams, callback) {
    debug("ENDPOINT: /notify");

    var self = this;

    if (!platform || typeof platform !== "string")
        return callback(new Error("You need to specify a platform"));

    if (!requiredParams || typeof requiredParams !== "object")
        return callback(new Error("Undefined required parameters"));

    if (typeof optionalParams === "function")
        callback = optionalParams;

    if (optionalParams && typeof optionalParams !== "object")
        return callback(new Error("Not an object"));

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
                if (!self.authenticated)
                    return next(new Error("Unauthorized"));

                switch (platform) {
                    case IOS_AND_MAC:
                        self._notifyIosAndMacPlatform(requiredParams, optionalParams, next);
                        break;
                    case SAFARI:
                        self._notifySafariPlatform(requiredParams, optionalParams, next);
                        break;
                    default:
                        next(new Error("Unknown platform type! Please chose between ios-mac or safari!"));
                        break;
                }
            }
        ],
        callback
    );
};

ZeroPush.prototype.register = function (requiredParams, optionalParams, callback) {
    debug("ENDPOINT: /register");

    var self = this;

    if (!requiredParams || typeof requiredParams !== "string" || !util.isArray(requiredParams))
        return callback(new Error("Undefined required parameter"));

    if (typeof optionalParams === "function")
        callback = optionalParams;

    if (optionalParams && typeof optionalParams !== "string" || !util.isArray(optionalParams))
        return callback(new Error("Undefined optional parameter"));

    async.waterfall(
        [
            function (next) {
                self._verifyCredentials(next);
            },
            function (next) {
                if (!self.authenticated)
                    return next(new Error("Unauthorized"));

                self._registerOneDeviceOrMultipleDevices(requiredParams, optionalParams, next);
            }
        ],
        callback
    );
};

ZeroPush.prototype.unregister = function (requiredParams, callback) {
    debug("ENDPOINT: /unregister");

    var self = this;

    if (!requiredParams || typeof requiredParams !== "string" || !util.isArray(requiredParams))
        return callback(new Error("Undefined required parameter"));

    async.waterfall(
        [
            function (next) {
                self._verifyCredentials(next);
            },
            function (next) {
                if (!self.authenticated)
                    return next(new Error("Unauthorized"));

                self._unregisterOneDeviceOrMultipleDevices(requiredParams, next);
            }
        ],
        callback
    );
};

ZeroPush.prototype.inactiveTokens = function (callback) {
    debug("ENDPOINT: /inactive_tokens");

    var self = this;

    async.waterfall(
        [
            function (next) {
                self._verifyCredentials(next);
            },
            function (next) {
                if (!self.authenticated)
                    return next(new Error("Unauthorized"));

                self._retrieveInactiveTokens(next);
            }
        ],
        callback
    );
};

ZeroPush.prototype.setBadge = function (requiredParams, callback) {
    debug("ENDPOINT: /set_badge");

    var self = this;

    if (!requiredParams || typeof requiredParams !== "object")
        return callback(new Error("Undefined required parameters"));

    debug("required parameters: %s", JSON.stringify(requiredParams));

    async.waterfall(
        [
            function (next) {
                self._verifyCredentials(next);
            },
            function (next) {
                if (!self.authenticated)
                    return next(new Error("Unauthorized"));

                self._setBadgeForOneOrMultipleDevices(requiredParams, next);
            }
        ],
        callback
    );
};

ZeroPush.prototype._verifyCredentials = function (callback) {
    debug("PRIVATE ENDPOINT: verifyCredentials");

    var self = this;
    var requestURL;
    var options;

    if (self.authenticated)
        return callback();

    requestURL = this.baseURL + ENDPOINTS.verify_credentials + "?" + this.authToken;
    options = clone(this.baseRequestOptions);

    options.method = "GET";
    options.url = requestURL;

    debug("requestURL: %s", requestURL);

    executeRequest(
        options,
        function (err, body, headers) {
            if (err)
                return callback(err);

            body.message === "authenticated" ?
                self.authenticated = true : self.authenticated = false;

            callback();
        }
    )
};

ZeroPush.prototype._notifySafariPlatform = function (requiredParams, optionalParams, callback) {
    debug("PRIVATE ENDPOINT: notifySafariPlatform");

    var self = this;
    var requestURL;
    var options;
    var body;

    if (typeof optionalParams === "function")
        callback = optionalParams;

    if (!util.isArray(requiredParams.device_tokens))
        return callback(new Error("Not an array"));

    if (!requiredParams.title || typeof requiredParams.title !== "string")
        return callback(new Error("Not a string"));

    if (!requiredParams.body || typeof requiredParams.body !== "string")
        return callback(new Error("Not a string"));

    requestURL = this.baseURL + ENDPOINTS.notify;
    options = clone(this.baseRequestOptions);

    options.method = "POST";
    options.headers["content-type"] = "application/x-www-form-urlencoded";
    options.url = requestURL;

    body = self.authToken;
    body += "&device_tokens[]=" + requiredParams.device_tokens.join(",");
    body += "&title=" + requiredParams.title;
    body += "&body=" + requiredParams.body;

    if (optionalParams && typeof optionalParams === "object") {
        if (optionalParams.expiry)
            body += "&expiry=" + optionalParams.expiry;

        if (optionalParams.label)
            body += "&label=" + optionalParams.label;

        if (optionalParams.url_args && util.isArray(optionalParams.url_args))
            body += "&url_args[]=" + optionalParams.url_args.join(",");
    }

    options.body = body;

    debug(options);

    executeRequest(
        options,
        function (err, body, headers) {
            if (err)
                return callback(err);

            self.quota = headers["x-push-quota"];
            self.quotaRemaining = headers["x-push-quota-remaining"];
            self.quotaOverage = headers["x-push-quota-overage"];
            self.quotaReset = headers["x-push-quota-reset"];

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
    var body;

    if (typeof optionalParams === "function")
        callback = optionalParams;

    if (!util.isArray(requiredParams.device_tokens))
        return callback(new Error("Not an array"));

    requestURL = this.baseURL + ENDPOINTS.notify;
    options = clone(this.baseRequestOptions);

    options.method = "POST";
    options.headers["content-type"] = "application/x-www-form-urlencoded";
    options.url = requestURL;

    body = self.authToken;
    body += "&device_tokens[]=" + requiredParams.device_tokens.join(",");

    if (optionalParams && typeof optionalParams === "object") {
        if (optionalParams.content_available)
            body += "&content_available=true";

        if (optionalParams.expiry)
            body += "&expiry=" + optionalParams.expiry;

        if (optionalParams.sound)
            body += "&sound=" + optionalParams.sound;

        if (optionalParams.badge)
            body += "&badge=" + optionalParams.badge;

        if (optionalParams.info) {
            if (typeof optionalParams.info === "object")
                optionalParams.info = JSON.parse(optionalParams.info);

            body += "&info=" + optionalParams.info;
        }

        if (optionalParams.alert) {
            if (typeof optionalParams.alert === "object")
                optionalParams.alert = JSON.parse(optionalParams.alert);

            body += "&alert=" + optionalParams.alert;
        }
    }

    options.body = body;

    debug(options);

    executeRequest(
        options,
        function (err, body, headers) {
            if (err)
                return callback(err);

            self.quota = headers["x-push-quota"];
            self.quotaRemaining = headers["x-push-quota-remaining"];
            self.quotaOverage = headers["x-push-quota-overage"];
            self.quotaReset = headers["x-push-quota-reset"];

            debug("quota: %s", self.quota);
            debug("quotaRemaining: %s", self.quotaRemaining);
            debug("quotaOverage: %s", self.quotaOverage);
            debug("quotaReset: %s", self.quotaReset);

            callback(null, body);
        }
    );
};

ZeroPush.prototype._registerOneDeviceOrMultipleDevices = function (requiredParams, optionalParams, callback) {
    debug("PRIVATE ENDPOINT: registerOneDeviceOrMultipleDevices");

    var self = this;

    if (util.isArray(requiredParams))
        self._registerMultipleDevices(requiredParams, optionalParams, callback);
    else
        self._registerDevice(requiredParams, optionalParams, callback);
};

ZeroPush.prototype._registerMultipleDevices = function (devices, channels, callback) {
    debug("PRIVATE ENDPOINT: registerMultipleDevices");

    var self = this;
    var requestURL;
    var options;
    var body;
    var responses = {};

    requestURL = this.baseURL + ENDPOINTS.register;
    options = clone(this.baseRequestOptions);

    options.method = "POST";
    options.headers["content-type"] = "application/x-www-form-urlencoded";
    options.url = requestURL;

    if (typeof channels === "function") {
        callback = channels;

        return async.each(
            devices,
            function (device, next) {
                body = self.authToken;
                body += "&device_token=" + device;

                options.body = body;

                debug(options);

                executeRequest(
                    options,
                    function (err, body, headers) {
                        if (err)
                            return next(err);

                        self.quota = headers["x-push-quota"];
                        self.quotaRemaining = headers["x-push-quota-remaining"];
                        self.quotaOverage = headers["x-push-quota-overage"];
                        self.quotaReset = headers["x-push-quota-reset"];

                        debug("quota: %s", self.quota);
                        debug("quotaRemaining: %s", self.quotaRemaining);
                        debug("quotaOverage: %s", self.quotaOverage);
                        debug("quotaReset: %s", self.quotaReset);

                        responses[device] = body;

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
                body = self.authToken;
                body += "&device_token=" + device;
                body += "&channel=" + channels;

                options.body = body;

                debug(options);

                executeRequest(
                    options,
                    function (err, body, headers) {
                        if (err)
                            return next(err);

                        self.quota = headers["x-push-quota"];
                        self.quotaRemaining = headers["x-push-quota-remaining"];
                        self.quotaOverage = headers["x-push-quota-overage"];
                        self.quotaReset = headers["x-push-quota-reset"];

                        debug("quota: %s", self.quota);
                        debug("quotaRemaining: %s", self.quotaRemaining);
                        debug("quotaOverage: %s", self.quotaOverage);
                        debug("quotaReset: %s", self.quotaReset);

                        responses[device] = body;

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
            responses[device] = {};

            async.each(
                channels,
                function (channel, next) {
                    body = self.authToken;
                    body += "&device_token=" + device;
                    body += "&channel=" + channel;

                    options.body = body;

                    debug(options);

                    executeRequest(
                        options,
                        function (err, body, headers) {
                            if (err)
                                return next(err);

                            self.quota = headers["x-push-quota"];
                            self.quotaRemaining = headers["x-push-quota-remaining"];
                            self.quotaOverage = headers["x-push-quota-overage"];
                            self.quotaReset = headers["x-push-quota-reset"];

                            debug("quota: %s", self.quota);
                            debug("quotaRemaining: %s", self.quotaRemaining);
                            debug("quotaOverage: %s", self.quotaOverage);
                            debug("quotaReset: %s", self.quotaReset);

                            responses[device][channel] = body;

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
    var body;

    requestURL = this.baseURL + ENDPOINTS.register;
    options = clone(this.baseRequestOptions);

    options.method = "POST";
    options.headers["content-type"] = "application/x-www-form-urlencoded";
    options.url = requestURL;

    if (typeof channels === "function") {
        callback = channels;

        body = self.authToken;
        body += "&device_token=" + device;

        options.body = body;

        debug(options);

        return executeRequest(
            options,
            function (err, body, headers) {
                if (err)
                    return callback(err);

                self.quota = headers["x-push-quota"];
                self.quotaRemaining = headers["x-push-quota-remaining"];
                self.quotaOverage = headers["x-push-quota-overage"];
                self.quotaReset = headers["x-push-quota-reset"];

                debug("quota: %s", self.quota);
                debug("quotaRemaining: %s", self.quotaRemaining);
                debug("quotaOverage: %s", self.quotaOverage);
                debug("quotaReset: %s", self.quotaReset);

                callback(null, body);
            }
        );
    }

    if (!util.isArray(channels)) {
        body = self.authToken;
        body += "&device_token=" + device;
        body += "&channel=" + channels;

        options.body = body;

        debug(options);

        return executeRequest(
            options,
            function (err, body, headers) {
                if (err)
                    return callback(err);

                self.quota = headers["x-push-quota"];
                self.quotaRemaining = headers["x-push-quota-remaining"];
                self.quotaOverage = headers["x-push-quota-overage"];
                self.quotaReset = headers["x-push-quota-reset"];

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
            body = self.authToken;
            body += "&device_token=" + device;
            body += "&channel=" + channel;

            options.body = body;

            debug(options);

            executeRequest(
                options,
                function (err, body, headers) {
                    if (err)
                        return next(err);

                    self.quota = headers["x-push-quota"];
                    self.quotaRemaining = headers["x-push-quota-remaining"];
                    self.quotaOverage = headers["x-push-quota-overage"];
                    self.quotaReset = headers["x-push-quota-reset"];

                    debug("quota: %s", self.quota);
                    debug("quotaRemaining: %s", self.quotaRemaining);
                    debug("quotaOverage: %s", self.quotaOverage);
                    debug("quotaReset: %s", self.quotaReset);

                    responses[channel] = body;

                    next();
                }
            );
        },
        function (err) {
            callback(err, responses);
        }
    );
};

ZeroPush.prototype._unregisterOneDeviceOrMultipleDevices = function (requiredParams, callback) {
    debug("PRIVATE ENDPOINT: unregisterOneDeviceOrMultipleDevices");

    var self = this;

    if (util.isArray(requiredParams))
        self._unregisterMultipleDevices(requiredParams, callback);
    else
        self._unregisterDevice(requiredParams, callback);
};

ZeroPush.prototype._unregisterMultipleDevices = function (devices, callback) {
    debug("PRIVATE ENDPOINT: unregisterMultipleDevices");

    var self = this;
    var requestURL;
    var options;
    var body;

    requestURL = this.baseURL + ENDPOINTS.unregister;
    options = clone(this.baseRequestOptions);

    options.method = "DELETE";
    options.headers["content-type"] = "application/x-www-form-urlencoded";
    options.url = requestURL;

    var responses = {};

    async.each(
        devices,
        function (device, next) {
            body = self.authToken;
            body += "&device_token=" + device;

            options.body = body;

            debug(options);

            executeRequest(
                options,
                function (err, body, headers) {
                    if (err)
                        return next(err);

                    self.quota = headers["x-push-quota"];
                    self.quotaRemaining = headers["x-push-quota-remaining"];
                    self.quotaOverage = headers["x-push-quota-overage"];

                    debug("quota: %s", self.quota);
                    debug("quotaRemaining: %s", self.quotaRemaining);
                    debug("quotaOverage: %s", self.quotaOverage);

                    responses[device] = body;

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
    var body;

    requestURL = this.baseURL + ENDPOINTS.unregister;
    options = clone(this.baseRequestOptions);

    options.method = "DELETE";
    options.headers["content-type"] = "application/x-www-form-urlencoded";
    options.url = requestURL;

    body = self.authToken;
    body += "&device_token=" + device;

    options.body = body;

    debug(options);

    executeRequest(
        options,
        function (err, body, headers) {
            if (err)
                return callback(err);

            self.quota = headers["x-push-quota"];
            self.quotaRemaining = headers["x-push-quota-remaining"];
            self.quotaOverage = headers["x-push-quota-overage"];

            debug("quota: %s", self.quota);
            debug("quotaRemaining: %s", self.quotaRemaining);
            debug("quotaOverage: %s", self.quotaOverage);

            callback(null, body);
        }
    );
};

ZeroPush.prototype._retrieveInactiveTokens = function (callback) {
    debug("PRIVATE ENDPOINT: retrieveInactiveTokens");

    var self = this;
    var requestURL;
    var options;

    requestURL = this.baseURL + ENDPOINTS.inactiveTokens;
    options = clone(this.baseRequestOptions);

    options.method = "GET";
    options.url = requestURL + "?" + self.authToken;

    debug(options);

    executeRequest(
        options,
        function (err, body) {
            if (err)
                return callback(err);

            callback(null, body);
        }
    );
};

ZeroPush.prototype._setBadgeForOneOrMultipleDevices = function (requiredParams, callback) {
    debug("PRIVATE ENDPOINT: setBadgeForOneOrMultipleDevices");

    var self = this;

    if (util.isArray(requiredParams.device_token))
        self._setBadgeForMultipleDevices(requiredParams, callback);
    else
        self._setBadgeForOneDevice(requiredParams, callback);
};

ZeroPush.prototype._setBadgeForMultipleDevices = function (requiredParams, callback) {
    debug("PRIVATE ENDPOINT: setBadgeForMultipleDevices");

    var self = this;
    var requestURL;
    var options;
    var body;
    var responses = {};

    requestURL = this.baseURL + ENDPOINTS.setBadge;
    options = clone(this.baseRequestOptions);

    options.method = "POST";
    options.headers["content-type"] = "application/x-www-form-urlencoded";
    options.url = requestURL;

    async.each(
        requiredParams.device_token,
        function (device, next) {
            body = self.authToken;
            body += "&device_token=" + device;
            body += "&badge=" + requiredParams.badge;

            options.body = body;

            debug(options);

            executeRequest(
                options,
                function (err, body, headers) {
                    if (err)
                        return next(err);

                    responses[device] = body;

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

    var self = this;
    var requestURL;
    var options;
    var body;

    requestURL = this.baseURL + ENDPOINTS.setBadge;
    options = clone(this.baseRequestOptions);

    options.method = "POST";
    options.headers["content-type"] = "application/x-www-form-urlencoded";
    options.url = requestURL;

    body = self.authToken;
    body += "&device_token=" + requiredParams.device_token;
    body += "&badge=" + requiredParams.badge;

    options.body = body;

    debug(options);

    executeRequest(
        options,
        function (err, body, headers) {
            if (err)
                return callback(err);

            callback(null, body);
        }
    );
};

module.exports = ZeroPush;


function executeRequest(options, callback) {
    debug("Executing request ...");

    request(
        options,
        function (err, res, body) {
            if (err)
                return callback(err);
            if (res.statusCode != HTTPStatus.OK)
                return callback(new Error("Expected status code " + HTTPStatus.OK + " and received " + res.statusCode));

            parseResponse(
                body,
                function (err, parsedBody) {
                    if (err)
                        return callback(err);

                    callback(null, parsedBody, res.headers);
                }
            );
        }
    );
}

function parseResponse(body, callback) {
    debug("Parsing request ...");

    try {
        body = JSON.parse(body);
        callback(null, body);
    } catch (err) {
        callback(err);
    }
}
