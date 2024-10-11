console.log("BinaryJsonPlugin.js is loaded");

(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    global.BinaryJsonPlugin = factory();
  }
})(this, function () {
  "use strict";

  class BinaryJsonPlugin extends Phaser.Plugins.BasePlugin {
    constructor(pluginManager) {
      super(pluginManager);
      console.log("BinaryJsonPlugin is initialized");
      this.addJsonLoader();
    }

    addJsonLoader() {
      if (
        Phaser.Loader &&
        Phaser.Loader.FileTypes &&
        Phaser.Loader.FileTypes.JSONFile
      ) {
        const JSONFile = Phaser.Loader.FileTypes.JSONFile;
        const originalLoad = JSONFile.prototype.load;

        JSONFile.prototype.load = function () {
          this.xhrSettings.responseType = "arraybuffer";
          return originalLoad.call(this);
        };

        JSONFile.prototype.onProcess = function () {
          console.log(`Processing file: ${this.key}`);
          try {
            if (this.xhrLoader.response instanceof ArrayBuffer) {
              const uint8Array = new Uint8Array(this.xhrLoader.response);
              console.log(`ArrayBuffer length: ${uint8Array.length}`);
              console.log(`First 20 bytes: ${uint8Array.slice(0, 20)}`);

              // Check if it's BSON or JSON
              if (
                uint8Array[0] === 123 &&
                uint8Array[uint8Array.length - 1] === 125
              ) {
                // It's likely JSON (starts with '{' and ends with '}')
                console.log("Detected JSON format, parsing as JSON");
                const jsonString = new TextDecoder().decode(uint8Array);
                this.data = JSON.parse(jsonString);
              } else {
                console.log("Attempting BSON deserialization");
                this.data = deserializeBSON(this.xhrLoader.response);
              }
            } else {
              console.log("Response is not ArrayBuffer, parsing as JSON");
              this.data = JSON.parse(this.xhrLoader.responseText);
            }

            console.log("Deserialized data:", this.data);

            if (
              this.data &&
              typeof this.data === "object" &&
              this.data.hasOwnProperty("data")
            ) {
              this.data = this.data.data;
            }

            console.log(`Successfully processed data for: ${this.key}`);
          } catch (e) {
            console.error(`Error processing file: ${this.key}`, e);
            console.log(
              `Raw response for ${this.key}:`,
              this.xhrLoader.response
            );
            this.data = null;
          }
          this.onProcessComplete();
        };

        console.log("JSON loader modified successfully");
      } else {
        console.warn(
          "Phaser.Loader.FileTypes.JSONFile not found. BinaryJsonPlugin may not work as expected."
        );
      }
    }
  }

  function deserializeBSON(buffer) {
    const view = new DataView(buffer);
    const totalLength = view.getInt32(0, true);
    console.log(`Total document length: ${totalLength}`);
    let offset = 4; // 문서 길이 다음부터 시작

    // 다음 4바이트 (6,0,0,0) 건너뛰기
    offset += 4;

    function readCString() {
      const start = offset;
      while (offset < totalLength && view.getUint8(offset) !== 0) offset++;
      if (offset >= totalLength) {
        throw new Error("Unterminated C string");
      }
      offset++;
      return new TextDecoder().decode(
        new Uint8Array(buffer, start, offset - start - 1)
      );
    }

    function readValue(type) {
      if (offset >= totalLength) {
        throw new Error("Unexpected end of buffer");
      }
      console.log(
        `Reading value of type: ${type.toString(16)}, offset: ${offset}`
      );
      switch (type) {
        case 0x01: // Double
          if (offset + 8 > totalLength)
            throw new Error("Buffer overflow reading double");
          const value = view.getFloat64(offset, true);
          offset += 8;
          return value;
        case 0x02: // String
          if (offset + 4 > totalLength)
            throw new Error("Buffer overflow reading string length");
          let length = view.getInt32(offset, true);
          offset += 4;
          console.log(
            `String length: ${length}, remaining buffer: ${
              totalLength - offset
            }`
          );
          // 문자열 길이 유효성 검사
          if (length < 0 || length > totalLength - offset) {
            console.warn(
              `Invalid string length: ${length}, adjusting to remaining buffer size`
            );
            length = Math.min(Math.max(0, totalLength - offset), 1024); // 최대 1KB로 제한
          }
          const str = new TextDecoder().decode(
            new Uint8Array(buffer, offset, length - 1)
          );
          offset += length;
          return str;
        case 0x03: // Object
          return readDocument();
        case 0x04: // Array
          return readArray();
        case 0x08: // Boolean
          if (offset >= totalLength)
            throw new Error("Buffer overflow reading boolean");
          return view.getUint8(offset++) !== 0;
        case 0x0a: // Null
          return null;
        default:
          console.warn(`Unsupported BSON type: ${type.toString(16)}`);
          offset++; // 알 수 없는 타입은 1바이트만 건너뛰기
          return null;
      }
    }

    function readDocument() {
      const docLength = view.getInt32(offset, true);
      const endOffset = Math.min(offset + docLength, totalLength);
      offset += 4;
      console.log(
        `Reading document: length ${docLength}, end offset ${endOffset}`
      );
      const doc = {};
      while (offset < endOffset - 1) {
        const type = view.getUint8(offset++);
        const key = readCString();
        console.log(`Reading key: ${key}`);
        doc[key] = readValue(type);
      }
      offset = endOffset; // 문서 끝으로 이동
      return doc;
    }

    function readArray() {
      const arrLength = view.getInt32(offset, true);
      const endOffset = Math.min(offset + arrLength, totalLength);
      offset += 4;
      console.log(
        `Reading array: length ${arrLength}, end offset ${endOffset}`
      );
      const arr = [];
      while (offset < endOffset - 1) {
        const type = view.getUint8(offset++);
        const index = parseInt(readCString(), 10);
        arr[index] = readValue(type);
      }
      offset = endOffset; // 배열 끝으로 이동
      return arr;
    }

    return readDocument();
  }

  return BinaryJsonPlugin;
});
