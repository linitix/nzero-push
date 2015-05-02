var fs   = require("fs");
var path = require("path");

var SUPPORTED_FILE_TYPES  = { schema: "schema" };
var SCHEMA_FILES_ROOT_DIR = path.join(__dirname, "..", "schemas");
var CACHE                 = { schema: {} };

module.exports = {
  loadSync: loadSync
};

function loadSync(filename, type) {
  var filePath;

  filename = filename.toLowerCase();
  type     = type.toLowerCase();

  if ( !CACHE[ type ][ filename ] ) {
    switch ( type ) {
      case SUPPORTED_FILE_TYPES.schema:
        filePath = path.join(SCHEMA_FILES_ROOT_DIR, filename + "_schema.json");
        break;
      default:
        filePath = path.join(SCHEMA_FILES_ROOT_DIR, filename + ".json");
        break;
    }

    CACHE[ type ][ filename ] = JSON.parse(fs.readFileSync(filePath, { encoding: "utf8" }));
  }

  return CACHE[ type ][ filename ];
}
