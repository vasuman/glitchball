/**
 * A simple 2D bitmap backed by a canvas element.
 */
function Bitmap(width, height) {
  this.can = document.createElement('canvas');
  this.ctx = this.can.getContext('2d');
  this.width = this.can.width = width;
  this.height = this.can.height = height;
}

Bitmap.prototype.drawBox = function(x, y, w, h) {
  this.ctx.fillRect(x, y, w, h);
}

Bitmap.prototype.clear = function() {
  this.ctx.clearRect(0, 0, this.width, this.height);
}
