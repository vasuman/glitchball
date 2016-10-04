/* exported graphics */
/* global GameState, twgl, V, SHADERS, PLAYER_SIZE */

var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;
var FOV = 70;
var NEAR_PLANE = 0.5;
var FAR_PLANE = 10000;
var MESH_SPACE = 20;
var LATTICE_STRUCT_WIDTH = 20;
var LATTICE_STRUCT_HEIGHT = 30;
var BORDER_SIZE = 10;
var CAM_SMOOTHNESS = 0.75;
var CAM_INCLINATION = 30;
var CAM_ELEVATION = 1;
var CAM_MIN_SCALE = 300;
var CAM_SCALE_ADJ = 2;
var HUD_PAD = 15;
var HUD_SCORE_FONT = '40px monospace';
var HUD_CHARGE_WIDTH = 300;
var HUD_CHARGE_MIX = 20;
var HUD_CHARGE_HEIGHT = 30;
var HUD_CHARGE_TEXT = 'Glitch';
var HUD_CHARGE_FONT = '12px sans-serif';
var ARENA_LINE_COLOR = [0.2, 0.2, 0.8, 0.5];
var ARENA_LATTICE_COLOR = [0.4, 0.4, 0.8, 0.5];

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
  this._drawHud();
  this.renderer.render();
}

Drawer.prototype._drawHud = function() {
  this._hud.ctx.clearRect(0, 0, this._hud.width, this._hud.height);
  this._drawPlayerInfo(this.world.players[0], true);
  this._drawPlayerInfo(this.world.players[1], false);
  // draw seperartor
  var x = this._hud.width / 2;
  var y = HUD_PAD + HUD_CHARGE_HEIGHT;
  this._hud.ctx.fillStyle = 'white';
  this._hud.ctx.font = HUD_SCORE_FONT;
  this._hud.ctx.textBaseline = 'top';
  this._hud.ctx.textAlign = 'center';
  this._hud.ctx.fillText('-', x, y);
}

Drawer.prototype._drawPlayerInfo = function(player, left) {
  var w = this._hud.width;
  this._hud.ctx.fillStyle = 'white';
  this._hud.ctx.font = HUD_SCORE_FONT;
  this._hud.ctx.textBaseline = 'top';
  this._hud.ctx.textAlign = left ? 'end' : 'start';
  var x = left ? w / 2 - HUD_PAD : w / 2 + HUD_PAD;
  var y = HUD_PAD + HUD_CHARGE_HEIGHT;
  this._hud.ctx.fillText(player.score.toString(), x, y);
  var r = player.charge / GLITCH_MIN_CHARGE;
  var lightColor;
  var color;
  if (player.state === PlayerState.SEEK) {
    this.lightColor = '#aaa';
    this.color = '#222';
    this._hud.ctx.shadowBlur = 7;
  } else if (player.charge - GLITCH_MIN_CHARGE < 0) {
    this.lightColor = '#aaa';
    this.color = '#a22';
    this._hud.ctx.shadowBlur = 10;
  } else {
    this.lightColor = '#fff';
    this.color = '#2a2';
    this._hud.ctx.shadowBlur = 20;
  }
  this._hud.ctx.fillStyle = this._hud.ctx.shadowColor = this.color;
  var y = HUD_PAD + HUD_CHARGE_HEIGHT;
  var width = Math.max(0, Math.round(player.charge / PLAYER_MAX_CHARGE * HUD_CHARGE_WIDTH));
  var x = left ? HUD_PAD : w - HUD_PAD - HUD_CHARGE_WIDTH;
  this._hud.ctx.fillRect(x, y, width, HUD_CHARGE_HEIGHT);
  this._hud.ctx.strokeStyle = this._hud.ctx.fillStyle =
    this._hud.ctx.shadowColor = this.lightColor;
  this._hud.ctx.lineWidth = 1;
  this._hud.ctx.strokeRect(x, y, HUD_CHARGE_WIDTH, HUD_CHARGE_HEIGHT);
  this._hud.ctx.font = HUD_CHARGE_FONT;
  this._hud.ctx.textAlign = 'start';
  this._hud.ctx.textBaseline = 'bottom';
  this._hud.ctx.fillText(HUD_CHARGE_TEXT, x, y);
  this._hud.ctx.shadowBlur = 0;
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
  var target = this.world.glitch.target;
  // clear screen
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  if (this.world.state === GameState.GLITCH) {
    if (this.world.glitch.target.state === PlayerState.ATTACK) {
      this._tracked.push(this.world.glitch.body.pos);
    } else {
      var idx = this.world.glitch.idx;
      this._tracked.push(
        this.world._latticePoint(idx[0], idx[1], target.left));
    }
    this.camera.update(this._tracked);
    this._tracked.pop();
  } else {
    this.camera.update(this._tracked);
  }
  this._drawArena();
  gl.lineWidth(2);
  gl.useProgram(this._spike.programInfo.program);
  twgl.setBuffersAndAttributes(gl, this._spike.programInfo,
    this._spike.bufferInfo);
  this._spike.uniforms.u_worldViewProjection = this.camera.viewProjection;
  this._drawItem(this.world.players[0]);
  this._drawItem(this.world.players[1]);
  this._drawItem(this.world.ball);
  if (target) {
    if (target.state == PlayerState.ATTACK) {
      this._drawItem(this.world.glitch);
    } else {
      var idx = this.world.glitch.idx;
      this._drawSpike(GLITCH_DRAW_PARAMS,
        this.world._latticePoint(idx[0], idx[1], target.left));
    }
  }
}

PerspectiveRenderer.prototype._drawItem = function(item) {
  this._drawSpike(item.drawParams, item.body.pos);
}

PerspectiveRenderer.prototype._drawSpike = function(params, pos) {
  pos.assignArray(this._spike.uniforms.u_point);
  this._spike.offset.from(pos);
  this._spike.offset.plus(MESH_SPACE - this._spike.meshSize / 2);
  this._spike.offset.snapTo(MESH_SPACE * 2);
  this._spike.offset.assignArray(this._spike.uniforms.u_offset);
  this._spike.uniforms.u_bulb = params.bulb;
  this._spike.uniforms.u_wireRatio = params.spread;
  this._spike.uniforms.u_color = params.color;
  this._spike.uniforms.u_coreSize = params.size;
  twgl.setUniforms(this._spike.programInfo, this._spike.uniforms);
  var gl = this.gl;
  gl.drawElements(gl.LINE_STRIP, this._spike.bufferInfo.numElements,
    gl.UNSIGNED_SHORT, 0);
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
  this._spike.programInfo = twgl.createProgramInfo(gl,
    [SHADERS.entVertex, SHADERS.entFragment]);
  this._spike.bufferInfo = twgl.createBufferInfoFromArrays(gl,
    this._spikeAttributes());
  this._arena = {
    uniforms: {
      u_color: [0, 0, 0, 0]
    }
  };
  this._arena.programInfo = twgl.createProgramInfo(gl,
    [SHADERS.arenaVertex, SHADERS.arenaFragment]);
  this._arena.lines = twgl.createBufferInfoFromArrays(gl,
    this._arenaLines());
   this._arena.lattice = twgl.createBufferInfoFromArrays(gl,
     this._arenaLattice());
  // this._arena.border = twgl.createBufferInfoFromArrays(gl,
  //   this._arenaBorder());
}

PerspectiveRenderer.prototype._drawArena = function() {
  var gl = this.gl;
  gl.useProgram(this._arena.programInfo.program);
  twgl.setBuffersAndAttributes(gl, this._arena.programInfo, this._arena.lines);
  this._arena.uniforms.u_worldViewProjection = this.camera.viewProjection;
  this._arena.uniforms.u_color = ARENA_LINE_COLOR;
  twgl.setUniforms(this._arena.programInfo, this._arena.uniforms);
  var length = GLITCH_LATTICE.layers * 4 + 24;
  gl.drawElements(gl.LINE_STRIP, length, gl.UNSIGNED_SHORT, 0);
  var target = this.world.glitch.target;
  if (target && target.state === PlayerState.DEFEND) {
    twgl.setBuffersAndAttributes(gl, this._arena.programInfo, this._arena.lattice);
    this._arena.uniforms.u_color = ARENA_LATTICE_COLOR;
    twgl.setUniforms(this._arena.programInfo, this._arena.uniforms);
    var n = this._arena.lattice.numElements;
    var offset = target.left ? n : 0;
    gl.drawElements(gl.LINES, n / 2, gl.UNSIGNED_SHORT, offset);
  }
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

  function populateIndex(i, j) {
    return indices.push(i + j * (k + 1));
  }

  for (var i = 0; i <= k; i++) {
    for (var j = 0; j <= k; j++) {
      pushPoint(i, j);
    }
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

PerspectiveRenderer.prototype._arenaBorder = function() {
  var position = [];
  var indices = [];
  return  {
    postition: position,
    indices: indices
  };
}

PerspectiveRenderer.prototype._arenaLattice = function() {
  var position = [];
  var indices = [];

  function vertEdge(x, y, dx, dy) {
    position.push(x + dx, y + dy, 1);
    position.push(x, y, LATTICE_STRUCT_HEIGHT);
    var idx = indices.length;
    indices.push(idx, idx + 1);
  }

  function flatEdge(x, y, dx, dy) {
    position.push(x + dx, y, 1);
    position.push(x, y + dy, 1);
    var idx = indices.length;
    indices.push(idx, idx + 1);
  }

  function latticeStruct(i, j, p) {
    var d = LATTICE_STRUCT_WIDTH;
    vertEdge(p.x, p.y, 0, d);
    vertEdge(p.x, p.y, 0, -d);
    vertEdge(p.x, p.y, d, 0);
    vertEdge(p.x, p.y, -d, 0);
    flatEdge(p.x, p.y, -d, d);
    flatEdge(p.x, p.y, -d, -d);
    flatEdge(p.x, p.y, d, d);
    flatEdge(p.x, p.y, d, -d);
    // flatEdge(p.x, p.y, 0, -d);
    // flatEdge(p.x, p.y, d, 0);
    // flatEdge(p.x, p.y, -d, 0);
  }

  this.world._eachLattice(false, latticeStruct);
  this.world._eachLattice(true, latticeStruct);
  return  {
    position: position,
    indices: indices
  };
}

PerspectiveRenderer.prototype._arenaLines = function() {
  var w = this.world.arena.w;
  var h = this.world.arena.h;
  var gS = this.world.goalSize;
  var pad = BORDER_SIZE;
  var angle = GLITCH_LATTICE.spread / 360 * Math.PI;
  var dY = Math.tan(angle) * w / 2;
  // TODO: cleanup unused points
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
    w, (h / 2 + gS), 0,
    w / 2, h / 2, 0,
    w, h / 2 + dY, 0,
    w, h / 2 - dY, 0,
    0, h / 2 - dY, 0,
    0, h / 2 + dY, 0,
    w - gS, h / 2, 0,
    gS, h / 2, 0,
  ];
  var indices = [
    5, 18, 19, 20, 21, 1,
    2, 22, 23, 24, 25, 6,
    27, 26, 31, 26, 28, 26,
    29, 26, 32, 26, 30, 5,
    6, 5
  ];

  function addPoint(x, y) {
    var idx = position.length / 3;
    position.push(x, y, 0);
    indices.push(idx);
  }

  var numLayers = 2 * GLITCH_LATTICE.layers;
  var layerSep = this.world.arena.w / numLayers;
  // vertical lines
  for (var i = 1; i < numLayers; i++) {
    var x = i * layerSep;
    if (i % 2 === 0) {
      addPoint(x, 0);
      addPoint(x, h);
    } else {
      addPoint(x, h);
      addPoint(x, 0);
    }
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
