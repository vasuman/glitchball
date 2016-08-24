/* exported loop */
/* global input, renderer, World */

var loop = (function() {
  var running;
  var world;

  function start() {
    running = true;
    world = new World(1000, 600, 150);
    world.initial();
    renderer.setup(world);
    tick();
  }

  function stop() {
    running = false;
  }

  function tick() {
    // update
    world.process(input.poll());
    world.step(1 / 60);
    // draw
    renderer.draw(world);
    if (running) {
      window.requestAnimationFrame(tick);
    }
  }

  return {
    start: start,
    stop: stop
  }
})();
