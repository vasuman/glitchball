var loop = (function() {
  var handle;
  var i = 0;

  function start() {
    tick();
  }

  function tick() {
    graphics.clear();
    graphics.box(i++, 10, 10, 10);
    handle = window.requestAnimationFrame(tick);
  }

  return {
    start: start
  };
})();
