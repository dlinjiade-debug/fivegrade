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

## 子站

| 路径 | 内容 | 说明 |
|---|---|---|
| `decimal-lab/` | 小数点实验室 | 小数乘法 / 小数除法 / 简易方程，含 3D 场景 |
| `blackboard/` | 粉笔小闯关 | 黑板板书风格的八关小闯关（第 1 单元 小数乘法） |

### 粉笔小闯关（`blackboard/`）

按「先讲、再练」两阶段组织：每关先在黑板上**一笔一笔**写出计算过程，
再进入这一关的配套练习。内容依据人教版五上第一单元达标测试卷编写。

- `js/bb-core.js` —— 纯函数层（竖式结构、小数点定位、答案判定），可 Node 单测
- `js/bb-chalk.js` —— 粉笔板书引擎（逐笔书写、粉笔尖跟随、擦除、点小数点跳格）
- `js/bb-levels.js` —— 八关讲解脚本 + 配套练习
- `js/bb-app.js` —— 关卡地图与关卡页交互
- `css/blackboard.css` —— 深墨绿黑板 + 木框 + 三色粉笔

子站资源用**单一整数版本号 `?v=N`**（两个 HTML 必须同步升）。
`tests/pwa-config.test.js` 会校验版本号一致、且每个 js/css 资源都在主站预缓存里。

## 验证

```powershell
npm test                      # 主站 + 子站单测
npm run check:blackboard      # 子站：站点契约 + 所有题目答案重算
npm run check:blackboard:browser   # 子站：真浏览器验收（断言 + 截图，需要 Edge/Chrome）
npm run check:all             # 上面全部
```

真浏览器验收会把 `blackboard/index.html`、`blackboard/level.html` 放进 iframe 真跑一遍，
读页面自己记下的 `window.__bbErrors` —— 引擎单测抓不到「页面行内脚本漏定义变量」这类问题。
截图输出在 `blackboard/shots/`（无头浏览器抓图等不到动画跑完，出图时强制「减少动效」，
板书会直接静态摆好，正好是验收终态）。

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
