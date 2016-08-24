/* exported renderer */
/* global GameState, Bitmap */

var renderer = (function() {

  var width;
  var height;

  // layers
  var screen;
  var base;
  var bg;
  var hud;

  function init(elt) {
    screen = new Bitmap(0, 0);
    base = new Bitmap(0, 0);
    bg = new Bitmap(0, 0);
    hud = new Bitmap(0, 0);
    elt.appendChild(screen.can);

    // XXX: settings
    hud.ctx.font = '16px Arial';
  }

  function setup(world) {
    width = world.arena.w;
    height = world.arena.h;
    screen.resize(width, height)
    base.resize(width, height)
    bg.resize(width, height)
    hud.resize(width, height)
    preDraw(world);
  }

  function draw(world) {
    clearLayers();
    base.ctx.globalAlpha = 0.8;
    base.ctx.globalAlpha = 1;
    drawEnt(world.one, 'blue');
    drawEnt(world.two, 'red');
    drawBall(world.ball);
    if (world.state == GameState.GLITCH) {
      drawGlitch(world);
    }
    drawScore(world.one.score, true);
    drawScore(world.two.score, false);
    screen.ctx.drawImage(bg.can, 0, 0);
    screen.ctx.drawImage(base.can, 0, 0);
    screen.ctx.drawImage(hud.can, 0, 0);
  }

  function clearLayers() {
    base.clear();
    screen.clear();
    hud.clear();
  }

  function drawEnt(ent, color) {
    base.ctx.fillStyle = color;
    base.drawBox(ent.body.bounds);
  }

  function drawBall(ball) {
    base.ctx.fillStyle = 'green';
    base.drawCircle(ball.body.pos, ball.body.bounds.w / 2);
  }

  function drawScore(score, left) {
    if (left) {
      hud.ctx.fillText('' + score, 20, 20);
    } else {
      hud.ctx.fillText('' + score, hud.width - 100, 20);
    }
  }

  function drawGlitch(world) {
    base.ctx.fillStyle = 'black';
    base.drawLine(world.glitch.pointer, world.glitch.target.body.pos);
  }

  function preDraw(world) {
    var midWidth = width / 2;
    var midHeight = height / 2;
    bg.ctx.lineWidth = 10;
    //bg.ctx.strokeRect(0, 0, width, height);
    bg.ctx.lineWidth = 2;
    bg.ctx.beginPath();
    bg.ctx.moveTo(midWidth, 0);
    bg.ctx.lineTo(midWidth, midHeight - 10);
    bg.ctx.moveTo(midWidth, midHeight + 10);
    bg.ctx.lineTo(midWidth, height);
    bg.ctx.stroke();
    bg.ctx.lineWidth = 20;
    bg.ctx.strokeStyle = 'orange';
    bg.ctx.beginPath();
    bg.ctx.moveTo(0, midHeight - world.goalSize / 2);
    bg.ctx.lineTo(0, midHeight + world.goalSize / 2);
    bg.ctx.moveTo(width, midHeight - world.goalSize / 2);
    bg.ctx.lineTo(width, midHeight + world.goalSize / 2);
    bg.ctx.stroke();
  }


  return {
    init: init,
    setup: setup,
    draw: draw
  };
})();
