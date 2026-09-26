# 数学解谜局 · 五年级数学实验工作台

这是一个电脑横屏优先、可离线安装的 PWA 数学学习工作台，面向五年级九个教材单元。

特色包括导演模式/闯关模式、慢速手写竖式、空间模型、面积切割、天平方程、概率实验和九章精华讲义。

## 在线访问

主站：https://dlinjiade-debug.github.io/fivegrade/

粉笔小闯关（黑板板书）：https://dlinjiade-debug.github.io/fivegrade/blackboard/index.html

## 本地运行

```powershell
python -m http.server 4187 --bind 127.0.0.1
```

打开 `http://127.0.0.1:4187/index.html` 即可使用。

进阶练习生成器本地入口：`http://127.0.0.1:4187/exercise-generator/`。

## 子站

| 路径 | 内容 | 说明 |
|---|---|---|
| `decimal-lab/` | 小数点实验室 | 小数乘法 / 小数除法 / 简易方程，含 3D 场景 |
| `blackboard/` | 粉笔小闯关 | 黑板板书风格的八关小闯关，**两个专题**：第 1 单元 小数乘法 + 第 3 单元 小数除法 |
| `exercise-generator/` | 进阶练习生成器 | 小数乘法、小数除法、简易方程三单元，参数化题库、逐笔板书与知识点说明 |

### 进阶练习生成器（`exercise-generator/`）

独立静态模块，采用单元模块、参数化题型目录、知识点资料和生成核心分层。三个单元有 11、8、11 类提高题型，每轮分别生成 33、24、33 题；教师模式逐笔演示竖式或解方程，学生模式可先提交答案。小数乘法的重复条目已合并。内容审查与修订见 [`exercise-generator/docs/curriculum-outline.md`](exercise-generator/docs/curriculum-outline.md)。

### 粉笔小闯关（`blackboard/`）

按「先讲、再练」两阶段组织：每关先在黑板上**一笔一笔**写出计算过程，
再进入这一关的配套练习。内容依据人教版五上第一单元（小数乘法）、第三单元（小数除法）编写。
两个专题共用同一套黑板引擎与页面，页头有标签可以随时切换；进度分开存档，互不影响。

- `js/bb-core.js` —— 纯函数层（竖式结构、小数点定位、答案判定、**展开器注册表**），可 Node 单测
- `js/bb-chalk.js` —— 粉笔板书引擎（逐笔书写、粉笔尖跟随、擦除、点小数点跳格）
- `js/bb-div.js` —— 除法的竖式排版与逐笔展开（注册成 `vdiv` 展开器，乘法代码一行没动）
- `js/bb-levels.js` / `js/bb-levels-div.js` —— 乘法八关 / 除法八关的讲解脚本 + 配套练习
- `js/bb-topics.js` —— 专题登记表（`?topic=mul|div`，站内链接一律带上它）
- `js/bb-app.js` —— 专题切换、关卡地图与关卡页交互
- `css/blackboard.css` —— 深墨绿黑板 + 木框 + 三色粉笔

子站资源用**单一整数版本号 `?v=N`**（两个 HTML 必须同步升）。
`tests/pwa-config.test.js` 会校验版本号一致、且每个 js/css 资源都在主站预缓存里 ——
**子站加新的 js 就必须同步加进主站 `PRECACHE_URLS`**，否则离线打开会命中不到缓存。

## 验证

```powershell
npm test                      # 主站 + 子站单测
npm run check:blackboard      # 子站：站点契约 + 所有题目答案重算
npm run check:blackboard:browser   # 子站：真浏览器验收（断言 + 截图，需要 Edge/Chrome）
npm run check:all             # 上面全部
```

真浏览器验收会把 `blackboard/index.html`、`blackboard/level.html` 放进 iframe 真跑一遍，
读页面自己记下的 `window.__bbErrors` —— 引擎单测抓不到「页面行内脚本漏定义变量」这类问题。
除断言之外还会量三件事：板书有没有越出黑板、**横线/竖线有没有压到数字上（上下左右四个方向都量）**、
除法的商与乘积有没有落在被除数对应的那一列上。

报告同时往屏幕和 `blackboard/shots/browser-check.log` 写一份，**自动化请以文件为准**
（stdout 接管道时 Node 的异步写会在退出时被截断，屏幕上可能只有开头几行）。

截图输出在 `blackboard/shots/`（无头浏览器抓图等不到动画跑完，出图时强制「减少动效」，
板书会直接静态摆好，正好是验收终态）。出图比较慢（一张十秒上下），
而「断言阶段」是用 `taskkill` 强杀整棵进程树的，之后同进程里再抓图会卡住，
所以**两件事要分两次跑**：

```powershell
node blackboard/tools/browser-check.js --no-shot      # 只跑断言
node blackboard/tools/browser-check.js --shots-only   # 只出图（报告写 browser-shots.log）
```

加了 `--base=<地址>` 就跳过本地服务器，把同一套断言打到**已部署的地址**上：

```powershell
node blackboard/tools/browser-check.js --base=https://dlinjiade-debug.github.io/fivegrade/blackboard --no-shot
```

本地全绿不等于线上能用（子路径、缓存、慢网络都只在线上才暴露），改完线上内容后应该跑这一趟收口。

## 网络提醒

若 `git push` 报 `Connection was reset` 或连不上 `github.com:443`，先看 DNS 把 `github.com`
解到了哪个 IP：本项目所在网络环境下 `20.205.243.166` 不可达，而 `140.82.112~121.3` 可达。
Git 2.43+ 可以只给 git 指定解析结果（不动系统 hosts）：

```powershell
git config --global http.curloptResolve "github.com:443:140.82.114.3"
```

撤销：`git config --global --unset http.curloptResolve`。
