/* exported renderer */
/* global Bitmap */

var renderer = (function() {

  var width = 1000;
  var height = 600;

  // setting up layers
  var screen = new Bitmap(width, height);
  var base = new Bitmap(width, height);
  var bg = new Bitmap(width, height);

  function init(elt) {
    preDraw();
    elt.appendChild(screen.can);
  }

  function draw(world) {
    clearLayers();
    base.ctx.globalAlpha = 0.8;
    base.ctx.globalAlpha = 1;
    drawEnt(world.one, 'blue');
    drawEnt(world.two, 'red');
    drawBall(world.ball);
    screen.ctx.drawImage(bg.can, 0, 0);
    screen.ctx.drawImage(base.can, 0, 0);
  }

  function getElement() {
    return screen.can;
  }

  function clearLayers() {
    base.clear();
    screen.clear();
  }

  function drawEnt(ent, color) {
    base.ctx.fillStyle = color;
    base.drawBox(ent.body.bounds);
  }

  function drawBall(ball) {
    base.ctx.fillStyle = 'green';
    base.drawCircle(ball.body.pos, ball.body.bounds.w / 2);
  }

  function preDraw() {
    bg.ctx.lineWidth = 10;
    bg.ctx.strokeRect(0, 0, width, height);
    bg.ctx.lineWidth = 2;
    bg.ctx.beginPath();
    bg.ctx.moveTo(width / 2, 0);
    bg.ctx.lineTo(width / 2, height / 2 - 10);
    bg.ctx.moveTo(width / 2, height / 2 + 10);
    bg.ctx.lineTo(width / 2, height);
    bg.ctx.stroke();
  }


  return {
    init: init,
    getElement: getElement,
    draw: draw
  };
})();
