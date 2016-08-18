var graphics = (function(){
  const width = 800;
  const height = 600;

  var can;
  var ctx;

  function init(container) {
    can = document.createElement('canvas');
    can.width = width;
    can.height = height;
    ctx = can.getContext('2d');
    container.appendChild(can);
  }

  function box(x, y, w, h) {
    ctx.fillRect(x, y, w, h);
  }

  function clear() {
    ctx.clearRect(0, 0, width, height);
  }

  return {
    init: init,
    box: box,
    clear: clear
  };
})();
