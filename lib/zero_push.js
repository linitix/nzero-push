var util = require("util");

var request = require("request");
var debug = require("debug")("main");
var async = require("async");
var HTTPStatus = require("http-status");

var ENDPOINTS = {
    verify_credentials: "verify_credentials",
    notify: "notify"
};
var IOS_AND_MAC = "ios-mac";
var SAFARI = "safari";

function ZeroPush(authToken) {
    this.baseURL = "https://api.zeropush.com/";
    this.authToken = "auth_token=" + authToken;
    this.authenticated;
    this.baseRequestOptions = {
        headers: {
            accept: "application/json"
        }
    };
    this.quota;
    this.quotaRemaining;
    this.quotaOverage;
    this.quotaReset;

    debug("baseURL: %s", this.baseURL);
    debug("authToken: %s", this.authToken);
}

ZeroPush.prototype.notify = function (platform, requiredParams, optionalParams, callback) {
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

ZeroPush.prototype._verifyCredentials = function (callback) {
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

    executeRequest(
        options,
        function (err, body, headers) {
            if (err)
                return callback(err);

            self.quota = headers["x-push-quota"];
            self.quotaRemaining = headers["x-push-quota-remaining"];
            self.quotaOverage = headers["x-push-quota-overage"];
            self.quotaReset = headers["x-push-quota-reset"];

            callback(null, body);
        }
    );
};

ZeroPush.prototype._notifyIosAndMacPlatform = function (requiredParams, optionalParams, callback) {
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

    executeRequest(
        options,
        function (err, body, headers) {
            if (err)
                return callback(err);

            self.quota = headers["x-push-quota"];
            self.quotaRemaining = headers["x-push-quota-remaining"];
            self.quotaOverage = headers["x-push-quota-overage"];
            self.quotaReset = headers["x-push-quota-reset"];

            callback(null, body);
        }
    );
};

module.exports = ZeroPush;

function executeRequest(options, callback) {
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
    try {
        body = JSON.parse(body);
        callback(null, body);
    } catch (err) {
        callback(err);
    }
}