/* exported renderer */
/* global Bitmap, constants */

var renderer = (function() {


  // setting up layers
  var width = constants.width;
  var height = constants.height;
  var screen = new Bitmap(width, height);
  var base = new Bitmap(width, height);

  function init(elt) {
    elt.appendChild(screen.can);
  }

  function draw() {
    screen.clear();
    screen.drawImage(0, 0, base.can);
  }

  return {
    base: base,
    init: init,
    draw: draw
  };
})();
