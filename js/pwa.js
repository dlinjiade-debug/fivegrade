(function () {
  if (!("serviceWorker" in navigator)) return;

  const isHttps = location.protocol === "https:";
  const isLocalhost = location.protocol === "http:" &&
    (location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.hostname === "[::1]");

  if (isHttps || isLocalhost) {
    navigator.serviceWorker.register("./sw.js").catch(function (error) {
      console.warn("数学解谜局离线支持注册失败：", error);
    });
  }
})();
