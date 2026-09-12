/* ==========================================================================
 *  Voxel3D —— 轻量级 3D 体素引擎（零依赖，canvas 2D 实现）
 *  为「观察物体」单元定制：
 *    · 鼠标/触摸拖拽任意旋转，滚轮缩放
 *    · 预设视角平滑动画（正面/上面/左面/右面/等距/背面）
 *    · 爆炸分解（看清每层每块）
 *    · 透视模式：从当前视角看不见的方块变半透明红——「看不见 ≠ 没有」
 *    · 相邻面剔除 + 画家算法 + 三面明暗，立体感强
 *  坐标系：x 向右，y 向后（深度），z 向上
 * ========================================================================== */
(function (root) {
  "use strict";

  var FACES = [
    { n: [0, 0, 1],  v: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], col: "#b5e09a" }, // 顶
    { n: [0, 0, -1], v: [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], col: "#4e8a35" }, // 底
    { n: [0, -1, 0], v: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], col: "#8fce68" }, // 前
    { n: [0, 1, 0],  v: [[0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]], col: "#6bb04a" }, // 后
    { n: [1, 0, 0],  v: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], col: "#5f9f3e" }, // 右
    { n: [-1, 0, 0], v: [[0, 0, 0], [0, 1, 0], [0, 1, 1], [0, 0, 1]], col: "#7dc057" }  // 左
  ];
  var EDGE = "#33561f";

  function key(x, y, z) { return x + "," + y + "," + z; }

  function Voxel3D(canvas, opts) {
    opts = opts || {};
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.unit = opts.unit || 58;
    this.persp = opts.persp || 11;
    this.cells = [];
    this.set = {};
    this.yaw = 0.46; this.pitch = 0.36;
    this.tYaw = this.yaw; this.tPitch = this.pitch;
    this.zoom = 1;
    this.tExplode = 0; this.explode = 0;
    this.xray = false;
    this.autoRot = false;
    this.pickInfo = [];   // 拾取用：{cell, aabb, depth}
    this.onPick = null;
    this.onClickEmpty = null;
    this._drag = null;

    var self = this;
    // ---- 交互 ----
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", function (e) {
      self._drag = { x: e.clientX, y: e.clientY, moved: false };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!self._drag) return;
      var dx = e.clientX - self._drag.x, dy = e.clientY - self._drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) self._drag.moved = true;
      self.tYaw = self.yaw = self.yaw + dx * 0.011;
      self.tPitch = self.pitch = Math.min(1.45, Math.max(-0.35, self.pitch - dy * 0.009));
      self._drag.x = e.clientX; self._drag.y = e.clientY;
    });
    canvas.addEventListener("pointerup", function (e) {
      if (self._drag && !self._drag.moved && self.onPick) {
        var c = self.pick(e.offsetX, e.offsetY);
        if (c) self.onPick(c);
        else if (self.onClickEmpty) self.onClickEmpty();
      }
      self._drag = null;
    });
    canvas.addEventListener("wheel", function (e) {
      e.preventDefault();
      self.zoom = Math.min(2.6, Math.max(0.45, self.zoom * (e.deltaY < 0 ? 1.1 : 0.9)));
    }, { passive: false });

    function loop() { self._render(); root.requestAnimationFrame(loop); }
    root.requestAnimationFrame(loop);
  }

  Voxel3D.prototype = {
    /** 设置方块集合，cells: [{x,y,z}] 或 [[x,y,z]] */
    setCells: function (cells) {
      this.cells = cells.map(function (c) {
        return Array.isArray(c) ? { x: c[0], y: c[1], z: c[2] } : c;
      });
      this.set = {};
      var lo = { x: 1e9, y: 1e9, z: 1e9 }, hi = { x: -1e9, y: -1e9, z: -1e9 };
      this.cells.forEach(function (c) {
        this.set[key(c.x, c.y, c.z)] = c;
        lo.x = Math.min(lo.x, c.x); lo.y = Math.min(lo.y, c.y); lo.z = Math.min(lo.z, c.z);
        hi.x = Math.max(hi.x, c.x); hi.y = Math.max(hi.y, c.y); hi.z = Math.max(hi.z, c.z);
      }, this);
      this.bounds = { lo: lo, hi: hi };
      this.center = { x: (lo.x + hi.x + 1) / 2, y: (lo.y + hi.y + 1) / 2, z: (lo.z + hi.z + 1) / 2 };
      // 自适应缩放：方块越多越小
      var span = Math.max(hi.x - lo.x + 1, hi.y - lo.y + 1, hi.z - lo.z + 1);
      this.fit = Math.min(1, 4.4 / span);
    },

    /** 设定视角（可动画） */
    setView: function (yaw, pitch, animate) {
      this.tYaw = yaw; this.tPitch = pitch;
      if (!animate) { this.yaw = yaw; this.pitch = pitch; }
    },
    setExplode: function (k) { this.tExplode = k; },
    setXray: function (b) { this.xray = !!b; },

    /** 视线遮挡判断：从当前相机方向看，方块 c 是否被其他方块挡住 */
    isHidden: function (c) {
      var cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
      var cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
      // 相机方向（单位向量，从场景指向相机）
      var ex = sy * cp, ey = -cy * cp, ez = sp;
      var maxT = 12;
      for (var t = 0.6; t < maxT; t += 0.5) {
        var kx = Math.floor(c.x + 0.5 + ex * t);
        var ky = Math.floor(c.y + 0.5 + ey * t);
        var kz = Math.floor(c.z + 0.5 + ez * t);
        if (kx === c.x && ky === c.y && kz === c.z) continue;
        if (this.set[key(kx, ky, kz)]) return true;
      }
      return false;
    },

    _projPoint: function (p, cx, cyc) {
      var cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
      var cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
      var x1 = p[0] * cy - p[1] * sy;
      var y1 = p[0] * sy + p[1] * cy;
      var depth = y1 * cp - p[2] * sp;
      var z2 = y1 * sp + p[2] * cp;
      var s = this.persp / (this.persp + depth);
      return { x: cx + x1 * this.unit * this.zoom * s, y: cyc - z2 * this.unit * this.zoom * s, d: depth, s: s };
    },

    pick: function (px, py) {
      var best = null;
      this.pickInfo.forEach(function (it) {
        if (px >= it.aabb[0] && px <= it.aabb[2] && py >= it.aabb[1] && py <= it.aabb[3]) {
          if (!best || it.depth < best.depth) best = it;
        }
      });
      return best ? best.cell : null;
    },

    _render: function () {
      var ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
      // 动画插值
      if (this.autoRot) this.tYaw += 0.006;
      var dY = this.tYaw - this.yaw, dP = this.tPitch - this.pitch;
      if (Math.abs(dY) > 0.002 || Math.abs(dP) > 0.002) {
        this.yaw += dY * 0.16; this.pitch += dP * 0.16;
      } else { this.yaw = this.tYaw; this.pitch = this.tPitch; }
      this.explode += (this.tExplode - this.explode) * 0.12;
      if (Math.abs(this.tExplode - this.explode) < 0.004) this.explode = this.tExplode;

      ctx.clearRect(0, 0, W, H);
      var cx = W / 2, cyc = H / 2 + 14;
      if (!this.cells.length) return;

      var b = this.bounds, C = this.center;
      var spanR = Math.max(b.hi.x - b.lo.x, b.hi.y - b.lo.y, b.hi.z - b.lo.z) / 2 + 0.7;

      // ---- 地面阴影（随俯角压扁，水平视角时消失）----
      var groundMix = Math.max(0, Math.sin(this.pitch));
      if (groundMix > 0.03) {
        var g0 = this._projPoint([C.x, C.y, b.lo.z - 0.05], cx, cyc);
        ctx.save();
        ctx.globalAlpha = groundMix;
        ctx.fillStyle = "rgba(60,90,40,0.10)";
        ctx.beginPath();
        ctx.ellipse(g0.x, g0.y, spanR * this.unit * this.zoom * this.fit * 1.25, spanR * this.unit * this.zoom * this.fit * 0.42 * groundMix, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ---- 组装可见面 ----
      var list = [];  // {depth, pts, col, edge, hiddenCell}
      var pickInfo = [];
      var self = this;
      var cyv = Math.cos(this.yaw), syv = Math.sin(this.yaw);
      var cpv = Math.cos(this.pitch), spv = Math.sin(this.pitch);
      function rotN(n) {
        var x1 = n[0] * cyv - n[1] * syv;
        var y1 = n[0] * syv + n[1] * cyv;
        return { depth: y1 * cpv - n[2] * spv };
      }

      this.pickInfo = [];
      this.cells.forEach(function (c) {
        // 爆炸偏移
        var ox = 0, oy = 0, oz = 0;
        if (self.explode > 0.001) {
          ox = (c.x + 0.5 - C.x) * self.explode * 1.6;
          oy = (c.y + 0.5 - C.y) * self.explode * 1.6;
          oz = (c.z + 0.5 - C.z) * self.explode * 1.6;
        }
        var hidden = self.xray && self.isHidden(c);
        var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9, minD = 1e9;
        FACES.forEach(function (f) {
          // 相邻面剔除
          var nx = c.x + f.n[0], ny = c.y + f.n[1], nz = c.z + f.n[2];
          if (self.set[key(nx, ny, nz)]) return;
          var rn = rotN(f.n);
          if (rn.depth >= 0) return; // 背面剔除
          var pts = [], dsum = 0;
          f.v.forEach(function (vv) {
            var p = self._projPoint([c.x + vv[0] - 0.5 - C.x + ox, c.y + vv[1] - 0.5 - C.y + oy, c.z + vv[2] - 0.5 - C.z + oz], cx, cyc);
            pts.push(p);
            dsum += p.d;
            if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
          });
          var depth = dsum / 4;
          if (depth < minD) minD = depth;
          list.push({
            depth: depth, pts: pts,
            col: hidden ? "rgba(229,57,53,0.30)" : f.col,
            edge: hidden ? "rgba(198,40,40,0.85)" : EDGE,
            dash: hidden,
          });
        });
        if (maxX > -1e8) {
          self.pickInfo.push({ cell: c, aabb: [minX, minY, maxX, maxY], depth: minD });
        }
      });

      // 画家算法：远的先画
      list.sort(function (a, b2) { return b2.depth - a.depth; });
      var scale = this.unit * this.zoom * this.fit;
      list.forEach(function (it) {
        ctx.beginPath();
        it.pts.forEach(function (p, i) { i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); });
        ctx.closePath();
        ctx.fillStyle = it.col;
        ctx.fill();
        if (it.dash) ctx.setLineDash([5, 4]);
        ctx.strokeStyle = it.edge;
        ctx.lineWidth = 1.7;
        ctx.stroke();
        ctx.setLineDash([]);
      });
      this._scale = scale;
    },
  };

  root.Voxel3D = Voxel3D;
})(typeof window !== "undefined" ? window : global);
