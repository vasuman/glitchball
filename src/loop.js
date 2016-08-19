/* exported loop */
/* global layers, reducer, World */

var loop = (function() {
  var running;
  var world;
  var inputs;

  function start() {
    running = true;
    inputs = {
      player: [],
      other: []
    };
    world = new World();

    tick();
  }

  function stop() {
    running = false;
  }

  function tick() {
    populateInput();

    // update
    reducer(world, inputs);

    // draw
    layers.draw();

    if (running) {
      window.requestAnimationFrame(tick);
    }
  }

  function populateInput() {
  }

  return {
    start: start,
    stop: stop
  }
})();
