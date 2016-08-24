/**
 * A simple 2D bitmap backed by a canvas element.
 */
function Bitmap(width, height) {
  this.can = document.createElement('canvas');
  this.ctx = this.can.getContext('2d');
  this.resize(width, height);
}

Bitmap.prototype.drawBox = function(b) {
  this.ctx.fillRect(b.x, b.y, b.w, b.h);
}

Bitmap.prototype.drawCircle = function(p, r) {
  this.ctx.beginPath();
  this.ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
  this.ctx.fill();
}

Bitmap.prototype.drawLine = function(s, e) {
  this.ctx.beginPath();
  this.ctx.moveTo(s.x, s.y);
  this.ctx.lineTo(e.x, e.y);
  this.ctx.stroke();
}

Bitmap.prototype.clear = function() {
  this.ctx.clearRect(0, 0, this.width, this.height);
}

Bitmap.prototype.resize = function(width, height) {
  this.width = this.can.width = width;
  this.height = this.can.height = height;
}
