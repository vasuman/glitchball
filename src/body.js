/* exported Body */
/* global Box, V */

var DAMPENING = 0.955;

function Body() {
  this.bounds = new Box();
  this.pos = new V();
  this.vel = new V();
  this.acc = new V();
}

Body.prototype.update = function(delT) {
  this.vel.fAdd(delT, this.acc);
  this.pos.fAdd(delT, this.vel);

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
