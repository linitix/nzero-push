var request = require("request");
var debug = require("debug")("main");
var async = require("async");
var HTTPStatus = require("http-status");

var ENDPOINTS = {
    verify_credentials: "verify_credentials"
};

function ZeroPush(authToken) {
    this.baseURL = "https://api.zeropush.com/";
    this.authToken = "?auth_token=" + authToken;
    this.authenticated;
    this.baseRequestOptions = {
        headers: {
            accept: "application/json"
        }
    };

    debug("baseURL: %s", this.baseURL);
    debug("authToken: %s", this.authToken);
}

ZeroPush.prototype._verifyCredentials = function (callback) {
    var self = this;
    var requestURL = this.baseURL + ENDPOINTS.verify_credentials + this.authToken;
    var options = clone(this.baseRequestOptions);

    options.method = "GET";
    options.url = requestURL;

    debug("requestURL: %s", requestURL);

    executeRequest(
        options,
        function (err, body) {
            if (err)
                return callback(err);

            body.message === "authenticated" ?
                self.authenticated = true : self.authenticated = false;

            callback();
        }
    )
};

module.exports = ZeroPush;

function executeRequest(options, callback) {
    request(
        options,
        function (err, res, body) {
            if (err)
                return callback(err);
            if (res.statusCode != HTTPStatus.OK)
                return callback();

            parseResponse(body, callback);
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