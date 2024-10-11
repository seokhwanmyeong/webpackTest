const BSON = require("bson");

module.exports = function (source) {
  const json = JSON.parse(source);
  const bson = BSON.serialize(json);
  return `module.exports = new Uint8Array([${Array.from(bson)}]);`;
};
