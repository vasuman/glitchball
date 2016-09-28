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
    world = new World(3200, 1600, 200);
    world.init();
    renderer = graphics.init(world);
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
