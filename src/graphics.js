/* exported graphics */
/* global GameState, twgl, V, SHADERS, PLAYER_SIZE */

var SCREEN_WIDTH = 1200;
var SCREEN_HEIGHT = 600;
var FOV = 70;
var NEAR_PLANE = 0.5;
var FAR_PLANE = 10000;
var MESH_SPACE = 20;
var BORDER_SIZE = 10;
var CAM_SMOOTHNESS = 0.75;
var CAM_INCLINATION = 30;
var CAM_ELEVATION = 1;
var CAM_MIN_SCALE = 300;
var CAM_SCALE_ADJ = 2;
var HUD_PAD = 15;
var HUD_SCORE_SIZE = 36;
var HUD_CHARGE_WIDTH = 200;
var HUD_CHARGE_MIX = 20;
var HUD_CHARGE_HEIGHT = 20;
var HUD_CHARGE_TEXT = 'Glitch';
var HUD_CHARGE_TEXT_PAD = 2;

var graphics = (function() {
  var root;

  function setRoot(_elt) {
    root = _elt;
  }

  function init(world) {
    return new Drawer(world, root);
  }

  return {
    setRoot: setRoot,
    init: init,
  };
})();

function Drawer(world, root) {
  this._root = root;
  this.world = world;
  this._rend = this._screenBuffer();
  this._hud = this._screenBuffer(true);
  this._setupRoot();
  this.renderer = new PerspectiveRenderer(world, this._rend.can);
}

Drawer.prototype.draw = function() {
  this._updateHud();
  this.renderer.render();
  //this.screen.draw(this._hud);
}

Drawer.prototype._updateHud = function() {
  this._hud.ctx.clearRect(0, 0, this._hud.width, this._hud.height);
  this._drawHudScore(this.world.players[0], true);
  this._drawHudScore(this.world.players[1], false);
  this._drawHudCharge(this.world.players[0], true);
  this._drawHudCharge(this.world.players[1], false);
}

Drawer.prototype._drawHudCharge = function(player, left) {
  var r = player.charge / GLITCH_MIN_CHARGE;
  var lightColor;
  var color;
  if (player.charge - GLITCH_MIN_CHARGE < 0) {
    lightColor = '#aaa';
    color = '#a22';
    this._hud.ctx.shadowBlur = 5;
  } else {
    lightColor = '#fff';
    color = '#2a2';
    this._hud.ctx.shadowBlur = 20;
  }
  this._hud.ctx.fillStyle = this._hud.ctx.shadowColor = color;
  var y = this._hud.height - HUD_PAD - HUD_CHARGE_HEIGHT;
  var width = Math.max(0, Math.round(player.charge / MAX_CHARGE * HUD_CHARGE_WIDTH));
  var x = left ? HUD_PAD : this._hud.width - HUD_PAD - HUD_CHARGE_WIDTH;
  this._hud.ctx.fillRect(x, y, width, HUD_CHARGE_HEIGHT);
  this._hud.ctx.lineWidth = 1;
  this._hud.ctx.strokeStyle = lightColor;
  this._hud.ctx.strokeRect(x, y, HUD_CHARGE_WIDTH, HUD_CHARGE_HEIGHT);
  this._hud.ctx.fillStyle = this._hud.ctx.shadowColor = lightColor;
  this._hud.ctx.font = (HUD_CHARGE_HEIGHT - HUD_CHARGE_TEXT_PAD) + 'px sans-serif';
  this._hud.ctx.textAlign = 'start';
  this._hud.ctx.textBaseline = 'top';
  this._hud.ctx.fillText(HUD_CHARGE_TEXT, x + HUD_CHARGE_TEXT_PAD, y);
  this._hud.ctx.shadowBlur = 0;
}

Drawer.prototype._drawHudScore = function(player, left) {
  this._hud.ctx.fillStyle = 'white';
  this._hud.ctx.font = HUD_SCORE_SIZE + 'px monospace';
  this._hud.ctx.textBaseline = 'top';
  this._hud.ctx.textAlign = left ? 'start' : 'end';
  var x = left ? HUD_PAD : this._hud.width - HUD_PAD;
  var y = HUD_PAD;
  this._hud.ctx.fillText(player.score.toString(), x, y);
}

Drawer.prototype._setHudFont = function() {
}

Drawer.prototype._screenBuffer = function(initCtx) {
  var ret = {};
  ret.can = document.createElement('canvas');
  ret.width = ret.can.width = SCREEN_WIDTH;
  ret.height = ret.can.height = SCREEN_HEIGHT;
  if (initCtx) {
    ret.ctx = ret.can.getContext('2d');
  }
  return ret;
}

Drawer.prototype._setupRoot = function() {
  this._root.appendChild(this._rend.can);
  this._root.appendChild(this._hud.can);
}

function PerspectiveRenderer(world, can) {
  this.world = world;
  this._setupGL(can);
  this._setupCamera(can);
}

PerspectiveRenderer.prototype.render = function() {
  var time = Date.now();
  var gl = this.gl;
  var m4 = twgl.m4;
  // clear screen
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
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.clearColor(0, 0, 0, 1.0);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
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
      u_boundMax: [this.world.arena.w, this.world.arena.h],
      u_goalSize: this.world.goalSize
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
  this._spike.offset.plus(MESH_SPACE - this._spike.meshSize / 2);
  this._spike.offset.snapTo(MESH_SPACE * 2);
  this._spike.offset.assignArray(this._spike.uniforms.u_offset);
  twgl.setUniforms(this._spike.programInfo, this._spike.uniforms);
  gl.drawElements(gl.LINE_STRIP, this._spike.bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
}

PerspectiveRenderer.prototype._drawArena = function() {
  var gl = this.gl;
  gl.useProgram(this._arena.programInfo.program);
  twgl.setBuffersAndAttributes(gl, this._arena.programInfo, this._arena.bufferInfo);
  this._arena.uniforms.u_color = [0.4, 0.4, 1, 1];
  this._arena.uniforms.u_worldViewProjection = this.camera.viewProjection;
  twgl.setUniforms(this._arena.programInfo, this._arena.uniforms);
  gl.drawElements(gl.TRIANGLE_STRIP, 8, gl.UNSIGNED_SHORT, 0);
  gl.drawElements(gl.TRIANGLE_STRIP, 8, gl.UNSIGNED_SHORT, 16);
  this._arena.uniforms.u_color = [0.2, 0.2, 1, 0.5];
  twgl.setUniforms(this._arena.programInfo, this._arena.uniforms);
  gl.drawElements(gl.LINE_STRIP, window._del || 15, gl.UNSIGNED_SHORT, 32);
}

PerspectiveRenderer.prototype._spikeAttributes = function() {
  var size = this._spike.meshSize = BALL_SIZE * 4;
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
  var gS = this.world.goalSize;
  var pad = BORDER_SIZE;
  var position = [
    0, (h / 2 - gS), 0,
    0, 0, 0,
    w, 0, 0,
    w, (h / 2 - gS), 0,
    0, (h / 2 + gS), 0,
    0, h, 0,
    w, h, 0,
    w, (h / 2 + gS), 0,
    -pad, (h / 2 - gS), 1,
    -pad, -pad, 1,
    w + pad, -pad, 1,
    w + pad, (h / 2 - gS), 1,
    -pad, (h / 2 + gS), 1,
    -pad, h + pad, 1,
    w + pad, h + pad, 1,
    w + pad, (h / 2 + gS), 1,
    w / 2, 0, 0,
    w / 2, h, 0,
    0, (h / 2 + gS), 0,
    gS, (h / 2 + gS), 0,
    gS, (h / 2 - gS), 0,
    0, (h / 2 - gS), 0,
    w, (h / 2 - gS), 0,
    w - gS, (h / 2 - gS), 0,
    w - gS, (h / 2 + gS), 0,
    w, (h / 2 + gS), 0
  ];
  var indices = [
    0, 8, 1, 9, 2, 10, 3, 11,
    7, 15, 6, 14, 5, 13, 4, 12,
    16, 17,
    5, 18, 19, 20, 21, 1,
    2, 22, 23, 24, 25, 6, 17
  ];
  for (var i = 0; i < 8; i++) {
    indices.push(i);
  }
  return {
    position: {numComponents: 3, data: position},
    indices: indices,
  };
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
  this._initProjection();
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

Camera.prototype._initProjection = function() {
  this._projection = twgl.m4.perspective(
    FOV * Math.PI / 180,
    this.aR,
    NEAR_PLANE, FAR_PLANE);
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
