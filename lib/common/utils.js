var JSONValidator = require("is-my-json-valid");

var VALIDATORS = {};
var PLATFORMS  = {
  ANDROID  : "android",
  IOS_MACOS: "ios_macos",
  SAFARI   : "safari"
};

function validateJSONWithSchema(data, schemaName, schema) {
  if ( !VALIDATORS[ schemaName ] )
    VALIDATORS[ schemaName ] = JSONValidator(schema);

  VALIDATORS[ schemaName ](data);

  return VALIDATORS[ schemaName ].errors;
}

module.exports = {
  validateJSONWithSchema: validateJSONWithSchema,
  PLATFORMS             : PLATFORMS
};
