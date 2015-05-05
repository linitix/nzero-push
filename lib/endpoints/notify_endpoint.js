var debug = require("debug")("NotifyEndpoint");
var async = require("neo-async");

var JSONFileLoader = require("../common/json_file_loader");
var Utils          = require("../common/utils");

var InvalidPayloadError = require("../errors/invalid_payload_error");

var iosMacosNotificationSchema = JSONFileLoader.loadSync("ios_macos_notification", "schema");
var safariNotificationSchema   = JSONFileLoader.loadSync("safari_notification", "schema");
var androidNotificationSchema  = JSONFileLoader.loadSync("android_notification", "schema");
var platformSchema             = JSONFileLoader.loadSync("platform", "schema");
var deviceTokensSchema         = JSONFileLoader.loadSync("device_tokens", "schema");

module.exports = function (platform, deviceTokens, notification, callback, self) {
  var platformErrors,
      deviceTokenErrors,
      iosMacosNotificationErrors,
      safariNotificationErrors,
      androidNotificationErrors;

  platformErrors    = Utils.validateJSONWithSchema(platform, "platform", platformSchema);
  deviceTokenErrors = Utils.validateJSONWithSchema(deviceTokens, "device_tokens", deviceTokensSchema);

  if ( platformErrors )
    return callback(new InvalidPayloadError("Unknown platform", platformErrors));

  debug("Platform: " + platform);

  if ( deviceTokenErrors )
    return callback(new InvalidPayloadError("Device tokens must be an array with at least one item or unique items of type string", deviceTokenErrors));

  debug("Device tokens: " + JSON.stringify(deviceTokens));

  switch ( platform.toLowerCase() ) {
    case Utils.PLATFORMS.ANDROID:
      androidNotificationErrors = Utils.validateJSONWithSchema(notification, "android_notification", androidNotificationSchema);

      if ( androidNotificationErrors )
        return callback(new InvalidPayloadError("Invalid Android notification object", androidNotificationErrors));

      debug("Android notification object: " + JSON.stringify(notification));

      notifyPlatform(deviceTokens, notification, callback, self);
      break;
    case Utils.PLATFORMS.IOS_MACOS:
      iosMacosNotificationErrors = Utils.validateJSONWithSchema(notification, "ios_macos_notification", iosMacosNotificationSchema);

      if ( iosMacosNotificationErrors )
        return callback(new InvalidPayloadError("Invalid iOS or MacOS notification object", iosMacosNotificationErrors));

      debug("iOS or MacOS notification object: " + JSON.stringify(notification));

      notifyPlatform(deviceTokens, notification, callback, self);
      break;
    case Utils.PLATFORMS.SAFARI:
      safariNotificationErrors = Utils.validateJSONWithSchema(notification, "safari_notification", safariNotificationSchema);

      if ( safariNotificationErrors )
        return callback(new InvalidPayloadError("Invalid Safari notification object", safariNotificationErrors));

      debug("Safari notification object: " + JSON.stringify(notification));

      notifyPlatform(deviceTokens, notification, callback, self);
      break;
  }
};

function notifyPlatform(deviceTokens, notification, callback, self) {
  async.waterfall(
    [
      function (next) { self.requestsManager.verifyCredentials(next); },
      function (next) { self.requestsManager.notify(deviceTokens, notification, next); }
    ],
    callback
  );
}
