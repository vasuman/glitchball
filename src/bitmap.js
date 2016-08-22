/**
 * A simple 2D bitmap backed by a canvas element.
 */
function Bitmap(width, height) {
  this.can = document.createElement('canvas');
  this.ctx = this.can.getContext('2d');
  this.width = this.can.width = width;
  this.height = this.can.height = height;
}

Bitmap.prototype.drawBox = function(b) {
  this.ctx.fillRect(b.x, b.y, b.w, b.h);
}

Bitmap.prototype.drawCircle = function(p, r) {
  this.ctx.beginPath();
  this.ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
  this.ctx.fill();
}

Bitmap.prototype.clear = function() {
  this.ctx.clearRect(0, 0, this.width, this.height);
}
