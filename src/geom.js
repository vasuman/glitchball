/* exported V, Box, Direction */

var Direction = {
  UP: 1,
  DOWN: 2,
  LEFT: 3,
  RIGHT: 4
};

function V(x, y) {
  this.x = x || 0;
  this.y = y || 0;
}

V.prototype.round = function() {
  this.x = Math.round(this.x);
  this.y = Math.round(this.y);
}

V.prototype.plus = function(v) {
  this.x += v;
  this.y += v;
}

V.prototype.add = function(o) {
  this.x += o.x;
  this.y += o.y;
}

V.prototype.sub = function(o) {
  this.x -= o.x;
  this.y -= o.y;
}

V.prototype.fAdd = function(f, o) {
  this.x += f * o.x;
  this.y += f * o.y;
}

V.prototype.scale = function(f) {
  this.x *= f;
  this.y *= f;
}

V.prototype.length = function() {
  return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
}

V.prototype.set = function(x, y) {
  this.x = x;
  this.y = y;
}

V.prototype.from = function(v) {
  this.x = v.x;
  this.y = v.y;
}

V.prototype.fromDirection = function(dir) {
  switch (dir) {
      case Direction.UP:
          this.y += 1;
          break;
      case Direction.DOWN:
          this.y -= 1;
          break;
      case Direction.LEFT:
          this.x -= 1;
          break;
      case Direction.RIGHT:
          this.x += 1;
          break;
  }
}

V.prototype.normalize = function() {
  var d = this.length();
  if (d !== 0) {
    this.scale(1 / d);
  }
}

V.prototype.limit = function(b, pad) {
  this.x = Math.max(Math.min(this.x, b.x + b.w - pad), b.x + pad);
  this.y = Math.max(Math.min(this.y, b.y + b.h - pad), b.y + pad);
}

V.prototype.clear = function() {
  this.x = this.y = 0;
}

V.prototype.assignArray = function(arr) {
  arr[0] = this.x;
  arr[1] = this.y;
}

V.prototype.snapTo = function(size) {
  this.x = Math.floor(this.x / size) * size;
  this.y = Math.floor(this.y / size) * size;
}

V.prototype.mux = function(f, o) {
  this.x = this.x * f + (1 - f) * o.x;
  this.y = this.y * f + (1 - f) * o.y;
}

/*
 * Describes a box.
 * @param {Number} x Left.
 * @param {Number} y Top.
 * @param {Number} w Width.
 * @param {Number} h Height.
 */
function Box(x, y, w, h) {
  this.x = x || 0;
  this.y = y || 0;
  this.w = w || 0;
  this.h = h || 0;
}

Box.prototype.center = function(v) {
  if (!v) {
    v = new V();
  }
  v.x = this.x + this.w / 2;
  v.y = this.y + this.h / 2;
  return v;
}

Box.prototype.setCenter = function(v) {
  this.x = v.x - this.w / 2;
  this.y = v.y - this.h / 2;
}

Box.prototype.setDim = function(w, h) {
  this.w = w;
  this.h = h;
}

Box.prototype.contains = function(b) {
  return this.x <= b.x && b.x + b.w <= this.x + this.w &&
    this.y <= b.y && b.y + b.h <= this.y + this.h;
}

Box.prototype.intersects = function(b) {
  return this.x <= b.x + b.w && b.x <= this.x + this.w &&
    this.y <= b.y + b.h && b.y <= this.y + this.h;
}

Box.prototype.within = function(v) {
  return this.x <= v.x && v.x <= this.x + this.w &&
    this.y <= v.y && v.y <= this.y + this.h;
}
