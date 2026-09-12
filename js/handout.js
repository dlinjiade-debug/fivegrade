(function () {
  "use strict";

  const host = document.getElementById("handoutPages");
  const printButton = document.getElementById("printHandout");

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text != null) element.textContent = text;
    return element;
  }

  function detail(label, value, className) {
    const row = node("div", "chapter-detail " + (className || ""));
    row.appendChild(node("strong", "detail-label", label));
    row.appendChild(node("p", "detail-copy", value));
    return row;
  }

  function chapterCard(chapter) {
    const article = node("article", "chapter-card");
    const header = node("header", "chapter-heading");
    header.appendChild(node("span", "chapter-number", chapter.number));
    const identity = node("div", "chapter-identity");
    identity.appendChild(node("h2", "", chapter.officialName));
    identity.appendChild(node("p", "", "案卷主题 · " + chapter.caseName));
    header.appendChild(identity);
    article.appendChild(header);
    article.appendChild(detail("核心", chapter.core, "core"));

    const method = node("div", "chapter-detail methods");
    method.appendChild(node("strong", "detail-label", "方法"));
    const list = node("ul", "detail-copy");
    chapter.methods.forEach(function (line) { list.appendChild(node("li", "", line)); });
    method.appendChild(list);
    article.appendChild(method);

    article.appendChild(detail("易错", chapter.mistake, "mistake"));
    article.appendChild(detail("例", chapter.example, "example"));
    return article;
  }

  function render(data) {
    host.innerHTML = "";
    for (let pageIndex = 0; pageIndex < 3; pageIndex += 1) {
      const page = node("section", "handout-page");
      page.setAttribute("aria-label", "讲义第 " + (pageIndex + 1) + " 页");
      const header = node("header", "page-heading");
      const title = node("div", "page-title");
      title.appendChild(node("p", "brand", "数学解谜局 · KNOWLEDGE FILE"));
      title.appendChild(node("h1", "", data.title));
      title.appendChild(node("p", "subtitle", data.subtitle));
      header.appendChild(title);
      header.appendChild(node("span", "page-index", String(pageIndex + 1).padStart(2, "0") + " / 03"));
      page.appendChild(header);

      const chapters = node("div", "chapter-list");
      data.chapters.slice(pageIndex * 3, pageIndex * 3 + 3)
        .forEach(function (chapter) { chapters.appendChild(chapterCard(chapter)); });
      page.appendChild(chapters);

      const footer = node("footer", "page-footer");
      footer.appendChild(node("span", "", "先说方法，再做一步验证。"));
      footer.appendChild(node("span", "", "五年级数学 · 知识点精华"));
      page.appendChild(footer);
      host.appendChild(page);
    }
  }

  fetch("data/handout-content.json")
    .then(function (response) {
      if (!response.ok) throw new Error("讲义内容读取失败");
      return response.json();
    })
    .then(render)
    .catch(function () {
      host.innerHTML = '<p class="handout-error" role="alert">讲义暂时无法读取，请刷新页面后重试。</p>';
    });

  if (printButton) printButton.addEventListener("click", function () { window.print(); });
})();
