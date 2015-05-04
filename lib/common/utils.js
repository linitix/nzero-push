var JSONValidator = require("is-my-json-valid");

var VALIDATORS = {};
var PLATFORMS  = {
  ANDROID  : "android",
  IOS_MACOS: "ios_macos",
  SAFARI   : "safari"
};
var HEADERS    = {
  PUSH_QUOTA            : "x-push-quota",
  PUSH_QUOTA_REMAINING  : "x-push-quota-remaining",
  PUSH_QUOTA_OVERAGE    : "x-push-quota-overage",
  PUSH_QUOTA_RESET      : "x-push-quota-reset",
  DEVICE_QUOTA          : "x-device-quota",
  DEVICE_QUOTA_REMAINING: "x-device-quota-remaining",
  DEVICE_QUOTA_OVERAGE  : "x-device-quota-overage"
};

function validateJSONWithSchema(data, schemaName, schema) {
  if ( !VALIDATORS[ schemaName ] )
    VALIDATORS[ schemaName ] = JSONValidator(schema);

  VALIDATORS[ schemaName ](data);

  return VALIDATORS[ schemaName ].errors;
}

module.exports = {
  validateJSONWithSchema: validateJSONWithSchema,
  PLATFORMS             : PLATFORMS,
  HEADERS               : HEADERS
};
