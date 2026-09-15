(function (root, factory) {
  const config = factory();
  if (typeof module === "object" && module.exports) module.exports = config;
  if (root) root.MathMysteryPWA = config;
})(typeof self !== "undefined" ? self : globalThis, function () {
  return {
    CACHE_NAME: "math-mystery-v15",
    PRECACHE_URLS: [
      "./index.html",
      "./unit1.html", "./unit2.html", "./unit3.html", "./unit4.html", "./unit5.html",
      "./unit6.html", "./unit7.html", "./unit8.html", "./unit9.html",
      "./handout.html", "./css/style.css", "./css/mystery.css", "./css/mystery.css?v=15", "./css/handout.css",
      "./js/common.js", "./js/common.js?v=15", "./js/app-core.js", "./js/app-core.js?v=15", "./js/handwrite.js", "./js/handwrite.js?v=15", "./js/vertical-calc.js", "./js/vertical-calc.js?v=15", "./js/voxel3d.js",
      "./js/unit1.js", "./js/unit2.js", "./js/unit3.js", "./js/unit4.js", "./js/unit5.js",
      "./js/unit6.js", "./js/unit7.js", "./js/unit8.js", "./js/unit9.js",
      "./js/labs-arithmetic.js", "./js/labs-geometry.js", "./js/home.js", "./js/handout.js", "./js/pwa.js", "./js/pwa-config.js",
      "./data/handout-content.json",
      "./output/pdf/五年级数学知识点精华讲义.pdf",
      /* 粉笔小闯关子站：黑板板书 + 八关练习，离线也要能用。
         页面是按 ?v=2 取资源的，所以带版本号的键也要一起收，
         否则离线打开会命中不到缓存。子站升版时这里跟着改。 */
      "./blackboard/index.html", "./blackboard/level.html",
      "./blackboard/css/blackboard.css", "./blackboard/css/blackboard.css?v=4",
      "./blackboard/lib/handwrite.js", "./blackboard/lib/handwrite.js?v=4",
      "./blackboard/js/bb-core.js", "./blackboard/js/bb-core.js?v=4",
      "./blackboard/js/bb-chalk.js", "./blackboard/js/bb-chalk.js?v=4",
      "./blackboard/js/bb-levels.js", "./blackboard/js/bb-levels.js?v=4",
      "./blackboard/js/bb-app.js", "./blackboard/js/bb-app.js?v=4",
      "./manifest.webmanifest", "./icons/math-mystery.svg"
    ]
  };
});
