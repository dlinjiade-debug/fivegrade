(function () {
  if (!("serviceWorker" in navigator)) return;
  const secure = location.protocol === "https:";
  const local = location.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  if (secure || local) {
    navigator.serviceWorker.register("../sw.js").catch(function (error) {
      console.warn("数学练习生成器离线支持注册失败：", error);
    });
  }
})();
