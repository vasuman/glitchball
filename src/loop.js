/* exported loop */
/* global input, renderer, World */

var loop = (function() {
  var running;
  var world;
  var events = [];

  function start() {
    running = true;
    world = new World(1000, 600);
    world.initial();
    tick();
  }

  function stop() {
    running = false;
  }

  function tick() {
    populateEvents();
    // update
    world.process(events);
    world.step(1 / 60);
    // draw
    renderer.draw(world);
    if (running) {
      window.requestAnimationFrame(tick);
    }
  }

  function populateEvents() {
    events.splice(0, events.length);
    // poll input
    Array.prototype.push.apply(events, input.poll());
  }

  return {
    start: start,
    stop: stop
  }
})();
