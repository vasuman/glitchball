/* exported graphics */
/* global GameState, Bitmap, twgl, V, SHADERS, PLAYER_SIZE */

var SCREEN_WIDTH = 1200;
var SCREEN_HEIGHT = 600;
var FOV = 70;
var NEAR_PLANE = 0.5;
var FAR_PLANE = 10000;
var MESH_SPACE = 10;
var BORDER_SIZE = 40;
var CAM_SMOOTHNESS = 0.75;
var CAM_INCLINATION = 45;
var CAM_ELEVATION = 1;
var CAM_MIN_SCALE = 300;
var CAM_SCALE_ADJ = 2;

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
  this._setupCamera(can);
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

  if (this.world.state === GameState.GLITCH) {
    this._tracked.push(this.world.glitch.pointer);
    this.camera.update(this._tracked);
    this._tracked.pop();
  } else {
    this.camera.update(this._tracked);
  }

  this._drawArena();
  gl.lineWidth(2);
  this._spike.uniforms.u_wireRatio = 1.5;
  this._spike.uniforms.u_bulb = 1;
  this._spike.uniforms.u_color = [1, 1, 1, 1.0];
  this._drawSpike(this.world.ball.body.pos, BALL_SIZE);
  this._spike.uniforms.u_color = [1, 0, 0, 1.0];
  this._drawSpike(this.world.players[0].body.pos, PLAYER_SIZE);
  this._spike.uniforms.u_color = [0, 1, 0, 1.0];
  this._drawSpike(this.world.players[1].body.pos, PLAYER_SIZE);
  var glitch = this.world.glitch;
  if (glitch.target) {
    this._spike.uniforms.u_color = [1, 1, 0, 1.0];
    this._spike.uniforms.u_bulb = 0.8;
    this._spike.uniforms.u_wireRatio = 1;
    this._drawSpike(glitch.pointer, PLAYER_SIZE);
  }
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

PerspectiveRenderer.prototype._setupCamera = function(can) {
  var aspectRatio = can.clientWidth / can.clientHeight;
  this.camera = new Camera(aspectRatio);
  this._tracked = [];
  this._tracked.push(this.world.players[0].body.pos);
  this._tracked.push(this.world.players[1].body.pos);
  this._tracked.push(this.world.ball.body.pos);
}

PerspectiveRenderer.prototype._compilePrograms = function() {
  var gl = this.gl;
  this._spike = {
    offset: new V(),
    uniforms: {
      u_bulb: 1,
      u_offset: [0, 0, 0],
      u_point: [0, 0, 0],
      u_coreSize: 0,
      u_color: [0, 0, 0, 0],
      u_boundMin: [0, 0],
      u_boundMax: [this.world.arena.w, this.world.arena.h]
    }
  };
  this._spike.programInfo = twgl.createProgramInfo(gl, [SHADERS.entVertex, SHADERS.entFragment]);
  this._spike.bufferInfo = twgl.createBufferInfoFromArrays(gl, this._spikeAttributes());
  this._arena = {
    uniforms: {
      u_color: [0, 0, 0, 0]
    }
  };
  this._arena.programInfo = twgl.createProgramInfo(gl, [SHADERS.arenaVertex, SHADERS.arenaFragment]);
  this._arena.bufferInfo = twgl.createBufferInfoFromArrays(gl, this._arenaAttributes());
}

PerspectiveRenderer.prototype._drawSpike = function(pos, size) {
  var gl = this.gl;
  gl.useProgram(this._spike.programInfo.program);
  twgl.setBuffersAndAttributes(gl, this._spike.programInfo, this._spike.bufferInfo);
  pos.assignArray(this._spike.uniforms.u_point);
  this._spike.uniforms.u_worldViewProjection = this.camera.viewProjection;
  this._spike.uniforms.u_coreSize = size;
  this._spike.offset.from(pos);
  this._spike.offset.plus(-this._spike.meshSize / 2);
  this._spike.offset.snapTo(MESH_SPACE * 2);
  this._spike.offset.assignArray(this._spike.uniforms.u_offset);
  twgl.setUniforms(this._spike.programInfo, this._spike.uniforms);
  gl.drawElements(gl.LINE_STRIP, this._spike.bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
}

PerspectiveRenderer.prototype._drawArena = function() {
  var gl = this.gl;
  gl.lineWidth(1);
  gl.useProgram(this._arena.programInfo.program);
  twgl.setBuffersAndAttributes(gl, this._arena.programInfo, this._arena.bufferInfo);
  this._arena.uniforms.u_color = [0.3, 0.3, 1, 1];
  this._arena.uniforms.u_worldViewProjection = this.camera.viewProjection;
  twgl.setUniforms(this._arena.programInfo, this._arena.uniforms);
  gl.drawElements(gl.TRIANGLE_STRIP, 8, gl.UNSIGNED_SHORT, 0);
  gl.drawElements(gl.TRIANGLE_STRIP, 8, gl.UNSIGNED_SHORT, 16);
}

PerspectiveRenderer.prototype._spikeAttributes = function() {
  var size = this._spike.meshSize = PLAYER_SIZE * 4;
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

function Camera(aspectRatio) {
  this.aR = aspectRatio;
  this.focus = new V();
  this.scale = 1;
  this._baseElevation = CAM_ELEVATION;
  var distRatio = Math.tan(CAM_INCLINATION * Math.PI / 180);
  this._baseDistance = distRatio * this._baseElevation;
  this._eye = [0, 0, 0];
  this._target = [0, 0, 0];
  this._up = [0, 1, 1];
  this._avg = new V();
  this._projection = twgl.m4.perspective(
    FOV * Math.PI / 180,
    aspectRatio,
    NEAR_PLANE, FAR_PLANE);
  this.viewProjection = twgl.m4.identity();

  //FIXME
  window._cam = this;
}

Camera.prototype.update = function(tracked) {
  var m4 = twgl.m4;
  this._avg.clear();
  for (var i = 0; i < tracked.length; i++) {
    this._avg.add(tracked[i]);
  }
  this._avg.scale(1 / tracked.length);
  this._updateScale(this._avg, tracked);
  this.focus.mux(CAM_SMOOTHNESS, this._avg);
  this._updateEye();
  this.focus.assignArray(this._target);
  var camera = m4.inverse(m4.lookAt(this._eye, this._target, this._up));
  this.viewProjection = m4.multiply(camera, this._projection);
}

Camera.prototype._updateScale = function(center, tracked) {
  var scale = 1;
  var f = CAM_SMOOTHNESS;
  for (var i = 0; i < tracked.length; i++) {
    var p = tracked[i];
    var sepX = scale * this.aR;
    if (p.x < center.x - sepX || p.x > center.x + sepX) {
      scale = Math.abs(center.x - p.x) / this.aR;
    }
    var sepY = scale;
    if (p.y < center.y - sepY || p.y > center.y + sepY) {
      scale = Math.abs(center.y - p.y);
    }
  }
  scale *= CAM_SCALE_ADJ;
  this.scale = f * this.scale + (1 - f) * scale;
  this.scale = Math.max(CAM_MIN_SCALE, this.scale);
}

Camera.prototype._updateEye = function() {
  this._eye[0] = this.focus.x;
  this._eye[1] = this.focus.y - this.scale * this._baseDistance;
  this._eye[2] = this.scale * this._baseElevation;
}
