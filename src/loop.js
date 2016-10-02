/* exported loop */
/* global input, graphics, World */

var loop = (function() {
  var world, renderer, gameRunning;

  function start() {
    gameRunning = true;
    world = new World(3600, 2400, 200);
    world.init();
    renderer = graphics.init(world);
    tick();

    // FIXME!
    window._world = world;
    window._renderer = renderer;
  }

  function tick() {
    if (gameRunning) {
      // update
      world.process(input.poll());
      world.step(1 / 60);
      // draw
      renderer.draw();
      window.requestAnimationFrame(tick);
    }
  }

  function stop() {
    gameRunning = false;
    renderer.destroy();
  }

  return {
    start: start,
    stop: stop
  }
})();
