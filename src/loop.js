/* exported loop */
/* global input, graphics, World */

var Screen = {
  GAME: 1
};

var loop = (function() {
  var screen, world, renderer, gameRunning;

  function start() {
    screen = Screen.GAME;
    gameRunning = true;
    world = new World(1400, 600, 150);
    world.init();
    renderer = graphics.setup(world);
    tick();
  }

  function tick() {
    if (screen === Screen.GAME) {
      // update
      world.process(input.poll());
      world.step(1 / 60);
      // draw
      renderer.draw();
      if (gameRunning) {
        window.requestAnimationFrame(tick);
      }
    }
  }

  return {
    start: start,
    stop: stop
  }
})();
