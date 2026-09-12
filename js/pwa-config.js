(function (root, factory) {
  const config = factory();
  if (typeof module === "object" && module.exports) module.exports = config;
  if (root) root.MathMysteryPWA = config;
})(typeof self !== "undefined" ? self : globalThis, function () {
  return {
    CACHE_NAME: "math-mystery-v13",
    PRECACHE_URLS: [
      "./index.html",
      "./unit1.html", "./unit2.html", "./unit3.html", "./unit4.html", "./unit5.html",
      "./unit6.html", "./unit7.html", "./unit8.html", "./unit9.html",
      "./handout.html", "./css/style.css", "./css/mystery.css", "./css/mystery.css?v=13", "./css/handout.css",
      "./js/common.js", "./js/app-core.js", "./js/handwrite.js", "./js/handwrite.js?v=13", "./js/vertical-calc.js", "./js/vertical-calc.js?v=13", "./js/voxel3d.js",
      "./js/unit1.js", "./js/unit2.js", "./js/unit3.js", "./js/unit4.js", "./js/unit5.js",
      "./js/unit6.js", "./js/unit7.js", "./js/unit8.js", "./js/unit9.js",
      "./js/labs-arithmetic.js", "./js/labs-geometry.js", "./js/home.js", "./js/handout.js", "./js/pwa.js", "./js/pwa-config.js",
      "./data/handout-content.json",
      "./output/pdf/五年级数学知识点精华讲义.pdf",
      "./manifest.webmanifest", "./icons/math-mystery.svg"
    ]
  };
});
