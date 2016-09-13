/* exported graphics */
/* global GameState, Bitmap, twgl, V, SHADERS, PLAYER_SIZE */

var SCREEN_WIDTH = 1200;
var SCREEN_HEIGHT = 600;
var FOV = 75;
var NEAR_PLANE = 0.5;
var FAR_PLANE = 1000;
var MESH_SPACE = 10;
var BORDER_SIZE = 10;

var graphics = (function() {
  var can;

  function init(elt) {
    can = document.createElement('canvas');
    can.id = "game-canvas";
    elt.appendChild(can);
    can.width = SCREEN_WIDTH;
    can.height = SCREEN_HEIGHT;
  }

  function setup(world) {
    return new PerspectiveRenderer(world, can);
  }

  return {
    init: init,
    setup: setup,
  };
})();

function PerspectiveRenderer(world, can) {
  this.world = world;
  this._setupGL(can);
  this._setupMatrices();
}

PerspectiveRenderer.prototype.draw = function() {
  var time = Date.now();
  var gl = this.gl;
  var m4 = twgl.m4;

  // clear screen
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  this._updateMatrices();
  this._drawArena();
  gl.lineWidth(2);
  this._ent.uniforms.u_color = [1, 1, 1, 1.0];
  this._drawEnt(this.world.ball, BALL_SIZE);
  this._ent.uniforms.u_color = [1, 0, 0, 1.0];
  this._drawEnt(this.world.players[0], PLAYER_SIZE);
  this._ent.uniforms.u_color = [0, 1, 0, 1.0];
  this._drawEnt(this.world.players[1], PLAYER_SIZE);
}

PerspectiveRenderer.prototype._setupGL = function(can) {
  twgl.setDefaults({attribPrefix: "a_"});
  var gl = this.gl = twgl.getWebGLContext(can, {antialias: true});
  this._compilePrograms();
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  console.log(gl.ONE);
  gl.clearColor(0, 0, 0, 1.0);
  // FIXME
  window._gl = gl;
}

PerspectiveRenderer.prototype._compilePrograms = function() {
  var gl = this.gl;
  this._ent = {
    offset: new V(),
    uniforms: {
      u_offset: [0, 0, 0],
      u_point: [0, 0, 0],
      u_coreSize: 0,
      u_color: [0, 0, 0, 0],
      u_boundMin: [0, 0],
      u_boundMax: [this.world.arena.w, this.world.arena.h]
    }
  };
  this._ent.programInfo = twgl.createProgramInfo(gl, [SHADERS.entVertex, SHADERS.entFragment]);
  this._ent.bufferInfo = twgl.createBufferInfoFromArrays(gl, this._entAttributes());
  this._arena = {
    uniforms: {
      u_color: [0, 0, 0, 0]
    }
  };
  this._arena.programInfo = twgl.createProgramInfo(gl, [SHADERS.arenaVertex, SHADERS.arenaFragment]);
  this._arena.bufferInfo = twgl.createBufferInfoFromArrays(gl, this._arenaAttributes());
}

PerspectiveRenderer.prototype._setupMatrices = function() {
  var gl = this.gl;
  this._projection = twgl.m4.perspective(
    FOV * Math.PI / 180,
    gl.canvas.clientWidth / gl.canvas.clientHeight,
    NEAR_PLANE, FAR_PLANE);
  //var projection = m4.ortho(-width / 2, width / 2, -height / 4, height / 4, NEAR_PLANE, FAR_PLANE);
  //this._viewProjection = projection;
}

PerspectiveRenderer.prototype._updateMatrices = function() {
  var width = this.world.arena.w;
  var height = this.world.arena.h;
  var eye = [width / 2, 0, 300];
  var target = [width / 2, height / 2, 0];
  var up = [0, 1, 1];
  var m4 = twgl.m4;
  var camera = m4.inverse(m4.lookAt(eye, target, up));
  this._viewProjection = m4.multiply(camera, this._projection);
}

PerspectiveRenderer.prototype._drawEnt = function(ent, size) {
  var gl = this.gl;
  gl.useProgram(this._ent.programInfo.program);
  twgl.setBuffersAndAttributes(gl, this._ent.programInfo, this._ent.bufferInfo);
  ent.body.pos.assignArray(this._ent.uniforms.u_point);
  this._ent.uniforms.u_worldViewProjection = this._viewProjection;
  this._ent.uniforms.u_coreSize = size;
  this._ent.offset.from(ent.body.pos);
  this._ent.offset.plus(-this._ent.meshSize / 2);
  this._ent.offset.snapTo(MESH_SPACE * 2);
  this._ent.offset.assignArray(this._ent.uniforms.u_offset);
  twgl.setUniforms(this._ent.programInfo, this._ent.uniforms);
  gl.drawElements(gl.LINE_STRIP, this._ent.bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
}

PerspectiveRenderer.prototype._drawArena = function() {
  var gl = this.gl;
  gl.lineWidth(1);
  gl.useProgram(this._arena.programInfo.program);
  twgl.setBuffersAndAttributes(gl, this._arena.programInfo, this._arena.bufferInfo);
  this._arena.uniforms.u_color = [0.3, 0.3, 1, 1];
  this._arena.uniforms.u_worldViewProjection = this._viewProjection;
  twgl.setUniforms(this._arena.programInfo, this._arena.uniforms);
  gl.drawElements(gl.TRIANGLE_STRIP, 8, gl.UNSIGNED_SHORT, 0);
  gl.drawElements(gl.TRIANGLE_STRIP, 8, gl.UNSIGNED_SHORT, 16);
}

PerspectiveRenderer.prototype._entAttributes = function() {
  var size = this._ent.meshSize = PLAYER_SIZE * 4;
  var k = size / MESH_SPACE;
  var position = [];
  var indices = [];

  function pushPoint(i, j) {
      position.push(i * MESH_SPACE); // x
      position.push(j * MESH_SPACE); // y
      position.push(0); // z
  }

  for (var i = 0; i <= k; i++) {
    for (var j = 0; j <= k; j++) {
      pushPoint(i, j);
    }
  }

  if (k % 2 !== 0) {
    throw new Error('odd k: ', k);
  }

  function populateIndex(i, j) {
    return indices.push(i + j * (k + 1));
  }

  for (var i = 0; i < k; i += 2) {
    populateIndex(i, 0);
    for (var j = 0; j < k; j += 2) {
      populateIndex(i + 1, j);
      populateIndex(i, j + 1);
      populateIndex(i + 1, j + 2);
      populateIndex(i + 2, j + 1);
      populateIndex(i + 1, j);
      populateIndex(i, j);
      populateIndex(i, j + 2);
      populateIndex(i + 2, j + 2);
      populateIndex(i + 2, j);
      populateIndex(i + 1, j);
      populateIndex(i + 1, j + 2);
      populateIndex(i, j + 1);
      populateIndex(i + 2, j + 1);
      populateIndex(i + 2, j + 2);
      populateIndex(i, j + 2);
    }
    populateIndex(i + 2, j);
  }
  return {
    position: position,
    indices: indices,
  };
}

PerspectiveRenderer.prototype._arenaAttributes = function() {
  var w = this.world.arena.w;
  var h = this.world.arena.h;
  var gS = 0;
  var pad = BORDER_SIZE;
  var position = [
    0, (h - gS) / 2, 0,
    0, 0, 0,
    w, 0, 0,
    w, (h - gS) / 2, 0,
    0, (h + gS) / 2, 0,
    0, h, 0,
    w, h, 0,
    w, (h + gS) / 2, 0,
    -pad, (h - gS) / 2, 1,
    -pad, -pad, 1,
    w + pad, -pad, 1,
    w + pad, (h - gS) / 2, 1,
    -pad, (h + gS) / 2, 1,
    -pad, h + pad, 1,
    w + pad, h + pad, 1,
    w + pad, (h + gS) / 2, 1,
    0, h / 2, 0,
    w, h / 2, 0,
    0, h / 4, 0,
    w, h / 4, 0,
    0, 3 * h / 4, 0,
    w, 3 * h / 4, 0
  ];
  var indices = [
    0, 8, 1, 9, 2, 10, 3, 11,
    7, 15, 6, 14, 5, 13, 4, 12,
    2, 6, 1, 5
    // 16, 17, 18, 19, 20, 21
  ];
  for (var i = 0; i < 8; i++) {
    indices.push(i);
  }
  return {
    position: {numComponents: 3, data: position},
    indices: indices,
  };
}


function FlatRenderer(world, can) {
  var width = world.arena.w;
  var height = world.arena.h;
  this.ctx = can.getContext('2d');
  this.world = world;
  this.base = new Bitmap(width, height);
  this.bg = new Bitmap(width, height);
  this.hud = new Bitmap(width, height);
  this.hud.ctx.font = '16px Arial';
  this._preDraw(width, height);
}

FlatRenderer.prototype.draw = function() {
  this._clearLayers();
  this.ctx.clearRect(0, 0, this.world.arena.w, this.world.arena.h);
  this.base.ctx.globalAlpha = 0.8;
  this.base.ctx.globalAlpha = 1;
  this._drawEnt(this.world.players[0], 'blue');
  this._drawEnt(this.world.players[1], 'red');
  this._drawBall(this.world.ball);
  if (this.world.state == GameState.GLITCH) {
    this._drawGlitch(this.world.glitch);
  }
  this.ctx.drawImage(this.bg.can, 0, 0);
  this.ctx.drawImage(this.base.can, 0, 0);
  this.ctx.drawImage(this.hud.can, 0, 0);
}

FlatRenderer.prototype._clearLayers = function() {
  this.base.clear();
  this.hud.clear();
}

FlatRenderer.prototype._drawEnt = function(ent) {
  var color;
  if (ent.left) {
    this.hud.ctx.fillStyle = 'black';
    this.hud.ctx.fillText('' + ent.score, 100, 20);
    this.hud.ctx.fillStyle = ent.charge > GLITCH_MIN_CHARGE ? 'green' : 'red';
    this.hud.ctx.fillText('' + Math.max(Math.floor(ent.charge / 10), 0), 100, 40);
    color = 'blue';
  } else {
    this.hud.ctx.fillStyle = 'black';
    this.hud.ctx.fillText('' + ent.score, this.hud.width - 100, 20);
    this.hud.ctx.fillStyle = ent.charge > GLITCH_MIN_CHARGE ? 'green' : 'red';
    this.hud.ctx.fillText('' + Math.max(Math.floor(ent.charge / 10), 0), this.hud.width - 100, 40);
    color = 'magenta';
  }
  this.base.ctx.save();
  this.base.ctx.fillStyle = color;
  this.base.ctx.shadowColor = ent.charge > GLITCH_MIN_CHARGE ? 'green' : 'red';
  this.base.ctx.shadowBlur = Math.min(1, Math.max(0, ent.charge / GLITCH_MIN_CHARGE)) * 10;
  this.base.drawBox(ent.body.bounds);
  this.base.ctx.restore();
}

FlatRenderer.prototype._drawBall = function(ball) {
  this.base.ctx.fillStyle = 'green';
  this.base.drawCircle(ball.body.pos, ball.body.bounds.w / 2);
}

FlatRenderer.prototype._drawGlitch = function(glitch) {
  this.base.ctx.fillStyle = 'black';
  this.base.drawLine(glitch.pointer, glitch.target.body.pos);
}

FlatRenderer.prototype._preDraw = function(width, height) {
  var midWidth = width / 2;
  var midHeight = height / 2;
  this.bg.ctx.lineWidth = 2;
  this.bg.ctx.strokeRect(0, 0, width, height);
  this.bg.ctx.lineWidth = 2;
  this.bg.ctx.beginPath();
  this.bg.ctx.moveTo(midWidth, 0);
  this.bg.ctx.lineTo(midWidth, midHeight - 10);
  this.bg.ctx.moveTo(midWidth, midHeight + 10);
  this.bg.ctx.lineTo(midWidth, height);
  this.bg.ctx.stroke();
  this.bg.ctx.lineWidth = 20;
  this.bg.ctx.strokeStyle = 'orange';
  this.bg.ctx.beginPath();
  this.bg.ctx.moveTo(0, midHeight - this.world.goalSize / 2);
  this.bg.ctx.lineTo(0, midHeight + this.world.goalSize / 2);
  this.bg.ctx.moveTo(width, midHeight - this.world.goalSize / 2);
  this.bg.ctx.lineTo(width, midHeight + this.world.goalSize / 2);
  this.bg.ctx.stroke();
}

