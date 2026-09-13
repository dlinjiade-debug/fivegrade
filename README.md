# 数学解谜局 · 五年级数学实验工作台

这是一个电脑横屏优先、可离线安装的 PWA 数学学习工作台，面向五年级九个教材单元。

特色包括导演模式/闯关模式、慢速手写竖式、空间模型、面积切割、天平方程、概率实验和九章精华讲义。

## 在线访问

https://dlinjiade-debug.github.io/fivegrade/

## 本地运行

```powershell
python -m http.server 4187 --bind 127.0.0.1
```

打开 `http://127.0.0.1:4187/index.html` 即可使用。

## 验证

```powershell
npm test
```
