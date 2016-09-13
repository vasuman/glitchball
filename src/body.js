/* exported Body */
/* global Box, V */

var DAMPENING = 0.955;
var DELTA = 1 / 60;

function Body(size) {
  this.bounds = new Box();
  this.pos = new V();
  this.vel = new V();
  this.acc = new V();
  this.bounds.setDim(size, size);
  this._reBound();
}

Body.prototype.update = function() {
  this.vel.fAdd(DELTA, this.acc);
  this.pos.fAdd(DELTA, this.vel);

  this.vel.scale(DAMPENING);
  this.acc.clear();

  this._reBound();
}

Body.prototype.at = function(x, y) {
  this.pos.set(x, y);
  this._reBound();
}

Body.prototype.stop = function() {
  this.vel.clear();
  this.acc.clear();
}

Body.prototype._reBound = function() {
  this.bounds.setCenter(this.pos);
}
