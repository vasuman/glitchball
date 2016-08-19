/* exported V */

function V(x, y) {
  this.x = x || 0;
  this.y = y || 0;
}

V.prototype.round = function() {
  this.x = Math.round(this.x);
  this.y = Math.round(this.y);
}

V.prototype.add = function(o) {
  this.x += o.x;
  this.y += o.y;
}

V.prototype.distance = function(o) {
  var dX = this.x - o.x;
  var dY = this.y - o.y;
  return Math.sqrt(Math.pow(dX, 2) + Math.pow(dY, 2));
}
