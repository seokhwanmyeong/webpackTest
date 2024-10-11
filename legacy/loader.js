const path = require("path");

module.exports = function (source) {
  const filename = path.basename(this.resourcePath);

  if (filename === "api.js") {
    // api.js의 모든 함수를 전역 스코프에 노출
    return `
      (function(window) {
        ${source}
        Object.keys(this).forEach(key => {
          if (typeof this[key] === 'function') {
            window[key] = this[key];
          }
        });
      })(window);
    `;
  } else if (filename !== "main.js") {
    // 클래스 파일들을 전역 객체에 할당
    const className = path.basename(filename, ".js");
    const capitalizedClassName =
      className.charAt(0).toUpperCase() + className.slice(1);
    return `
      ${source}
      window.${capitalizedClassName} = ${capitalizedClassName};
    `;
  } else {
    // main.js는 그대로 반환
    return source;
  }
};
