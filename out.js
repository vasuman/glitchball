var Direction = {
    UP: 1,
    DOWN: 2,
    LEFT: 3,
    RIGHT: 4
};

function V(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

V.prototype.round = function() {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
};

V.prototype.plus = function(v) {
    this.x += v;
    this.y += v;
};

V.prototype.add = function(o) {
    this.x += o.x;
    this.y += o.y;
};

V.prototype.sub = function(o) {
    this.x -= o.x;
    this.y -= o.y;
};

V.prototype.fAdd = function(f, o) {
    this.x += f * o.x;
    this.y += f * o.y;
};

V.prototype.scale = function(f) {
    this.x *= f;
    this.y *= f;
};

V.prototype.length = function() {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
};

V.prototype.set = function(x, y) {
    this.x = x;
    this.y = y;
};

V.prototype.from = function(v) {
    this.x = v.x;
    this.y = v.y;
};

V.prototype.fromDirection = function(dir) {
    switch (dir) {
      case Direction.UP:
        this.y += 1;
        break;

      case Direction.DOWN:
        this.y -= 1;
        break;

      case Direction.LEFT:
        this.x -= 1;
        break;

      case Direction.RIGHT:
        this.x += 1;
        break;
    }
};

V.prototype.normalize = function() {
    var d = this.length();
    if (d !== 0) {
        this.scale(1 / d);
    }
};

V.prototype.limit = function(b, pad) {
    this.x = Math.max(Math.min(this.x, b.x + b.w - pad), b.x + pad);
    this.y = Math.max(Math.min(this.y, b.y + b.h - pad), b.y + pad);
};

V.prototype.clear = function() {
    this.x = this.y = 0;
};

V.prototype.assignArray = function(arr) {
    arr[0] = this.x;
    arr[1] = this.y;
};

V.prototype.snapTo = function(size) {
    this.x = Math.floor(this.x / size) * size;
    this.y = Math.floor(this.y / size) * size;
};

V.prototype.mux = function(f, o) {
    this.x = this.x * f + (1 - f) * o.x;
    this.y = this.y * f + (1 - f) * o.y;
};

function Box(x, y, w, h) {
    this.x = x || 0;
    this.y = y || 0;
    this.w = w || 0;
    this.h = h || 0;
}

Box.prototype.center = function(v) {
    if (!v) {
        v = new V();
    }
    v.x = this.x + this.w / 2;
    v.y = this.y + this.h / 2;
    return v;
};

Box.prototype.setCenter = function(v) {
    this.x = v.x - this.w / 2;
    this.y = v.y - this.h / 2;
};

Box.prototype.setDim = function(w, h) {
    this.w = w;
    this.h = h;
};

Box.prototype.contains = function(b) {
    return this.x <= b.x && b.x + b.w <= this.x + this.w && this.y <= b.y && b.y + b.h <= this.y + this.h;
};

Box.prototype.intersects = function(b) {
    return this.x <= b.x + b.w && b.x <= this.x + this.w && this.y <= b.y + b.h && b.y <= this.y + this.h;
};

Box.prototype.within = function(v) {
    return this.x <= v.x && v.x <= this.x + this.w && this.y <= v.y && v.y <= this.y + this.h;
};

var SCREEN_WIDTH = window.innerWidth;

var SCREEN_HEIGHT = window.innerHeight;

var FOV = 70;

var NEAR_PLANE = .5;

var FAR_PLANE = 1e4;

var MESH_SPACE = 20;

var LATTICE_STRUCT_WIDTH = 20;

var LATTICE_STRUCT_HEIGHT = 30;

var BORDER_SIZE = 10;

var CAM_SMOOTHNESS = .75;

var CAM_INCLINATION = 30;

var CAM_ELEVATION = 1;

var CAM_MIN_SCALE = 300;

var CAM_SCALE_ADJ = 2;

var HUD_PAD = 15;

var HUD_SCORE_FONT = "40px monospace";

var HUD_CHARGE_WIDTH = 300;

var HUD_CHARGE_MIX = 20;

var HUD_CHARGE_HEIGHT = 30;

var HUD_CHARGE_TEXT = "Glitch";

var HUD_CHARGE_FONT = "12px sans-serif";

var ARENA_LINE_COLOR = [ .2, .2, .8, .5 ];

var ARENA_LATTICE_COLOR = [ .4, .4, .8, .5 ];

var graphics = function() {
    var root;
    function setRoot(_elt) {
        root = _elt;
    }
    function init(world) {
        return new Drawer(world, root);
    }
    return {
        setRoot: setRoot,
        init: init
    };
}();

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
};

Drawer.prototype._drawHud = function() {
    this._hud.ctx.clearRect(0, 0, this._hud.width, this._hud.height);
    this._drawPlayerInfo(this.world.players[0], true);
    this._drawPlayerInfo(this.world.players[1], false);
    var x = this._hud.width / 2;
    var y = HUD_PAD + HUD_CHARGE_HEIGHT;
    this._hud.ctx.fillStyle = "white";
    this._hud.ctx.font = HUD_SCORE_FONT;
    this._hud.ctx.textBaseline = "top";
    this._hud.ctx.textAlign = "center";
    this._hud.ctx.fillText("-", x, y);
};

Drawer.prototype._drawPlayerInfo = function(player, left) {
    var w = this._hud.width;
    this._hud.ctx.fillStyle = "white";
    this._hud.ctx.font = HUD_SCORE_FONT;
    this._hud.ctx.textBaseline = "top";
    this._hud.ctx.textAlign = left ? "end" : "start";
    var x = left ? w / 2 - HUD_PAD : w / 2 + HUD_PAD;
    var y = HUD_PAD + HUD_CHARGE_HEIGHT;
    this._hud.ctx.fillText(player.score.toString(), x, y);
    var r = player.charge / GLITCH_MIN_CHARGE;
    var lightColor;
    var color;
    if (player.state === PlayerState.SEEK) {
        this.lightColor = "#aaa";
        this.color = "#222";
        this._hud.ctx.shadowBlur = 7;
    } else if (player.charge - GLITCH_MIN_CHARGE < 0) {
        this.lightColor = "#aaa";
        this.color = "#a22";
        this._hud.ctx.shadowBlur = 10;
    } else {
        this.lightColor = "#fff";
        this.color = "#2a2";
        this._hud.ctx.shadowBlur = 20;
    }
    this._hud.ctx.fillStyle = this._hud.ctx.shadowColor = this.color;
    var y = HUD_PAD + HUD_CHARGE_HEIGHT;
    var width = Math.max(0, Math.round(player.charge / PLAYER_MAX_CHARGE * HUD_CHARGE_WIDTH));
    var x = left ? HUD_PAD : w - HUD_PAD - HUD_CHARGE_WIDTH;
    this._hud.ctx.fillRect(x, y, width, HUD_CHARGE_HEIGHT);
    this._hud.ctx.strokeStyle = this._hud.ctx.fillStyle = this._hud.ctx.shadowColor = this.lightColor;
    this._hud.ctx.lineWidth = 1;
    this._hud.ctx.strokeRect(x, y, HUD_CHARGE_WIDTH, HUD_CHARGE_HEIGHT);
    this._hud.ctx.font = HUD_CHARGE_FONT;
    this._hud.ctx.textAlign = "start";
    this._hud.ctx.textBaseline = "bottom";
    this._hud.ctx.fillText(HUD_CHARGE_TEXT, x, y);
    this._hud.ctx.shadowBlur = 0;
};

Drawer.prototype._screenBuffer = function(initCtx) {
    var ret = {};
    ret.can = document.createElement("canvas");
    ret.width = ret.can.width = SCREEN_WIDTH;
    ret.height = ret.can.height = SCREEN_HEIGHT;
    if (initCtx) {
        ret.ctx = ret.can.getContext("2d");
    }
    return ret;
};

Drawer.prototype._setupRoot = function() {
    this._root.appendChild(this._rend.can);
    this._root.appendChild(this._hud.can);
};

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
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (this.world.state === GameState.GLITCH) {
        if (this.world.glitch.target.state === PlayerState.ATTACK) {
            this._tracked.push(this.world.glitch.body.pos);
        } else {
            var idx = this.world.glitch.idx;
            this._tracked.push(this.world._latticePoint(idx[0], idx[1], target.left));
        }
        this.camera.update(this._tracked);
        this._tracked.pop();
    } else {
        this.camera.update(this._tracked);
    }
    this._drawArena();
    gl.lineWidth(2);
    gl.useProgram(this._spike.programInfo.program);
    twgl.setBuffersAndAttributes(gl, this._spike.programInfo, this._spike.bufferInfo);
    this._spike.uniforms.u_worldViewProjection = this.camera.viewProjection;
    this._drawItem(this.world.players[0]);
    this._drawItem(this.world.players[1]);
    this._drawItem(this.world.ball);
    if (target) {
        if (target.state == PlayerState.ATTACK) {
            this._drawItem(this.world.glitch);
        } else {
            var idx = this.world.glitch.idx;
            this._drawSpike(GLITCH_DRAW_PARAMS, this.world._latticePoint(idx[0], idx[1], target.left));
        }
    }
};

PerspectiveRenderer.prototype._drawItem = function(item) {
    this._drawSpike(item.drawParams, item.body.pos);
};

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
    gl.drawElements(gl.LINE_STRIP, this._spike.bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
};

PerspectiveRenderer.prototype._setupGL = function(can) {
    twgl.setDefaults({
        attribPrefix: "a_"
    });
    var gl = this.gl = twgl.getWebGLContext(can, {
        antialias: true
    });
    this._compilePrograms();
    gl.enable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.clearColor(0, 0, 0, 1);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
};

PerspectiveRenderer.prototype._setupCamera = function(can) {
    var aspectRatio = can.clientWidth / can.clientHeight;
    this.camera = new Camera(aspectRatio);
    this._tracked = [];
    this._tracked.push(this.world.players[0].body.pos);
    this._tracked.push(this.world.players[1].body.pos);
    this._tracked.push(this.world.ball.body.pos);
};

PerspectiveRenderer.prototype._compilePrograms = function() {
    var gl = this.gl;
    this._spike = {
        offset: new V(),
        uniforms: {
            u_bulb: 1,
            u_offset: [ 0, 0, 0 ],
            u_point: [ 0, 0, 0 ],
            u_coreSize: 0,
            u_color: [ 0, 0, 0, 0 ],
            u_boundMin: [ 0, 0 ],
            u_boundMax: [ this.world.arena.w, this.world.arena.h ],
            u_goalSize: this.world.goalSize
        }
    };
    this._spike.programInfo = twgl.createProgramInfo(gl, [ SHADERS.entVertex, SHADERS.entFragment ]);
    this._spike.bufferInfo = twgl.createBufferInfoFromArrays(gl, this._spikeAttributes());
    this._arena = {
        uniforms: {
            u_color: [ 0, 0, 0, 0 ]
        }
    };
    this._arena.programInfo = twgl.createProgramInfo(gl, [ SHADERS.arenaVertex, SHADERS.arenaFragment ]);
    this._arena.lines = twgl.createBufferInfoFromArrays(gl, this._arenaLines());
    this._arena.lattice = twgl.createBufferInfoFromArrays(gl, this._arenaLattice());
};

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
};

PerspectiveRenderer.prototype._spikeAttributes = function() {
    var size = this._spike.meshSize = BALL_SIZE * 4;
    var k = size / MESH_SPACE;
    var position = [];
    var indices = [];
    function pushPoint(i, j) {
        position.push(i * MESH_SPACE);
        position.push(j * MESH_SPACE);
        position.push(0);
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
        indices: indices
    };
};

PerspectiveRenderer.prototype._arenaBorder = function() {
    var position = [];
    var indices = [];
    return {
        postition: position,
        indices: indices
    };
};

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
    }
    this.world._eachLattice(false, latticeStruct);
    this.world._eachLattice(true, latticeStruct);
    return {
        position: position,
        indices: indices
    };
};

PerspectiveRenderer.prototype._arenaLines = function() {
    var w = this.world.arena.w;
    var h = this.world.arena.h;
    var gS = this.world.goalSize;
    var pad = BORDER_SIZE;
    var angle = GLITCH_LATTICE.spread / 360 * Math.PI;
    var dY = Math.tan(angle) * w / 2;
    var position = [ 0, h / 2 - gS, 0, 0, 0, 0, w, 0, 0, w, h / 2 - gS, 0, 0, h / 2 + gS, 0, 0, h, 0, w, h, 0, w, h / 2 + gS, 0, -pad, h / 2 - gS, 1, -pad, -pad, 1, w + pad, -pad, 1, w + pad, h / 2 - gS, 1, -pad, h / 2 + gS, 1, -pad, h + pad, 1, w + pad, h + pad, 1, w + pad, h / 2 + gS, 1, w / 2, 0, 0, w / 2, h, 0, 0, h / 2 + gS, 0, gS, h / 2 + gS, 0, gS, h / 2 - gS, 0, 0, h / 2 - gS, 0, w, h / 2 - gS, 0, w - gS, h / 2 - gS, 0, w - gS, h / 2 + gS, 0, w, h / 2 + gS, 0, w / 2, h / 2, 0, w, h / 2 + dY, 0, w, h / 2 - dY, 0, 0, h / 2 - dY, 0, 0, h / 2 + dY, 0, w - gS, h / 2, 0, gS, h / 2, 0 ];
    var indices = [ 5, 18, 19, 20, 21, 1, 2, 22, 23, 24, 25, 6, 27, 26, 31, 26, 28, 26, 29, 26, 32, 26, 30, 5, 6, 5 ];
    function addPoint(x, y) {
        var idx = position.length / 3;
        position.push(x, y, 0);
        indices.push(idx);
    }
    var numLayers = 2 * GLITCH_LATTICE.layers;
    var layerSep = this.world.arena.w / numLayers;
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
        position: {
            numComponents: 3,
            data: position
        },
        indices: indices
    };
};

function Camera(aspectRatio) {
    this.aR = aspectRatio;
    this.focus = new V();
    this.scale = 1;
    this._baseElevation = CAM_ELEVATION;
    var distRatio = Math.tan(CAM_INCLINATION * Math.PI / 180);
    this._baseDistance = distRatio * this._baseElevation;
    this._eye = [ 0, 0, 0 ];
    this._target = [ 0, 0, 0 ];
    this._up = [ 0, 1, 1 ];
    this._avg = new V();
    this._initProjection();
    this.viewProjection = twgl.m4.identity();
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
};

Camera.prototype._initProjection = function() {
    this._projection = twgl.m4.perspective(FOV * Math.PI / 180, this.aR, NEAR_PLANE, FAR_PLANE);
};

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
};

Camera.prototype._updateEye = function() {
    this._eye[0] = this.focus.x;
    this._eye[1] = this.focus.y - this.scale * this._baseDistance;
    this._eye[2] = this.scale * this._baseElevation;
};

var SHIFT_KEY = 16;

var ENTER_KEY = 13;

var FORWARD_SLASH_KEY = 191;

var DOT_KEY = 190;

var V_KEY = 86;

var B_KEY = 66;

var ARROW_KEY_MAP = {
    38: Direction.UP,
    40: Direction.DOWN,
    37: Direction.LEFT,
    39: Direction.RIGHT
};

var WSAD_KEY_MAP = {
    87: Direction.UP,
    83: Direction.DOWN,
    65: Direction.LEFT,
    68: Direction.RIGHT
};

var InputAction = {
    MOVE: 1,
    GLITCH_BEGIN: 2,
    GLITCH_END: 3,
    MOVE_BEGIN: 4,
    MOVE_END: 5
};

function MoveEvent(source, direction, start) {
    this.type = EventType.INPUT;
    this.action = start ? InputAction.MOVE_BEGIN : InputAction.MOVE_END;
    this.source = source;
    this.direction = direction;
}

function GlitchEvent(source, start) {
    this.type = EventType.INPUT;
    this.action = start ? InputAction.GLITCH_BEGIN : InputAction.GLITCH_END;
    this.source = source;
}

var input = function() {
    var oneKeyMap = {
        move: WSAD_KEY_MAP,
        glitch: V_KEY
    };
    var twoKeyMap = {
        move: ARROW_KEY_MAP,
        glitch: FORWARD_SLASH_KEY
    };
    var sources = [ 0, 1 ];
    var maps = [ oneKeyMap, twoKeyMap ];
    var pending = [];
    var events = [];
    var isPressed = {};
    function trapKey(start, key) {
        for (var source = 0; source <= 1; source++) {
            if (maps[source].move.hasOwnProperty(key)) {
                dir = maps[source].move[key];
                pending.push(new MoveEvent(source, dir, start));
            }
            if (key === maps[source].glitch) {
                pending.push(new GlitchEvent(source, start));
            }
        }
    }
    function init(elt) {
        elt.addEventListener("keydown", function(e) {
            var code = e.keyCode;
            if (!isPressed[code]) {
                isPressed[code] = true;
                trapKey(true, code);
            }
        });
        elt.addEventListener("keyup", function(e) {
            var code = e.keyCode;
            if (isPressed[code]) {
                trapKey(false, code);
                delete isPressed[code];
            }
        });
    }
    function poll() {
        var key;
        var dir;
        events.splice(0, events.length);
        Array.prototype.push.apply(events, pending);
        pending.splice(0, pending.length);
        for (key in isPressed) {}
        return events;
    }
    return {
        init: init,
        poll: poll
    };
}();

var loop = function() {
    var world, renderer, gameRunning;
    function start() {
        gameRunning = true;
        world = new World(3600, 2400, 200);
        world.init();
        renderer = graphics.init(world);
        tick();
        window._world = world;
        window._renderer = renderer;
    }
    function tick() {
        if (gameRunning) {
            world.process(input.poll());
            world.step(1 / 60);
            renderer.draw();
            window.requestAnimationFrame(tick);
        }
    }
    function stop() {
        gameRunning = false;
        renderer.destroy();
    }
    return {
        start: start,
        stop: stop
    };
}();

function main() {
    input.init(document);
    var container = document.getElementById("main");
    graphics.setRoot(container);
    loop.start();
}

window.addEventListener("load", main);

var SHADERS = {
    entVertex: "precision mediump float;\n\nconst float goalFactor = 2.;\nconst float mixPow = 2.;\nconst vec4 black = vec4(0., 0., 0., 1.0);\nconst vec4 yellow = vec4(0., 0., 1., 1.0);\n\nuniform vec3 u_offset;\nuniform vec3 u_point;\nuniform float u_coreSize;\nuniform vec4 u_color;\nuniform mat4 u_worldViewProjection;\nuniform vec2 u_boundMin;\nuniform vec2 u_boundMax;\nuniform float u_bulb;\nuniform float u_wireRatio;\nuniform float u_goalSize;\n\nattribute vec3 a_position;\n\nvarying vec4 v_color;\n\nvoid main() {\n    float wireRadius = u_coreSize * u_wireRatio;\n    float halfX = (u_boundMin.x + u_boundMax.x) / 2.;\n    float halfY = (u_boundMin.y + u_boundMax.y) / 2.;\n    vec4 pos = vec4(a_position + u_offset, 1.0);\n    float dist = abs(length(a_position - (u_point - u_offset)));\n    float influence = 0.0;\n    v_color = black;\n    if (pos.x > u_boundMin.x && pos.y > u_boundMin.y && pos.x < u_boundMax.x && pos.y < u_boundMax.y) {\n        if (dist < u_coreSize) {\n            influence = sqrt(pow(u_coreSize, 2.0) - pow(dist, 2.0)) / u_coreSize;\n        }\n        if (dist < wireRadius) {\n            float frac = dist / wireRadius;\n            influence += 0.1 * (1. - frac);\n            vec4 color = u_color;\n            float mirX = (pos.x > halfX) ? u_boundMax.x - pos.x : pos.x;\n            float mirY = (pos.y > halfY) ?  pos.y - halfY : halfY - pos.y;\n            if (mirX <= u_goalSize && mirY <= u_goalSize) {\n                color = mix(color, yellow, 0.5);\n                influence *= goalFactor * pow(max(mirX, mirY) / u_goalSize, 2.);\n            }\n            v_color = mix(color, black, pow(frac, mixPow));\n        }\n        pos.z += influence * u_coreSize * u_bulb;\n    }\n    gl_Position = u_worldViewProjection * pos;\n}\n",
    entFragment: "precision mediump float;\n\nvarying vec4 v_color;\n\nvoid main() {\n    gl_FragColor = v_color;\n}\n",
    arenaVertex: "precision mediump float;\n\nattribute vec3 a_position;\n\nuniform mat4 u_worldViewProjection;\n\nvoid main() {\n    gl_Position = u_worldViewProjection * vec4(a_position.xyz, 1.);\n}\n\n",
    arenaFragment: "precision mediump float;\n\nuniform vec4 u_color;\n\nvoid main() {\n    gl_FragColor = u_color;\n}\n"
};

(function(root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    }
    if (typeof module !== "undefined" && module.exports) {
        module.exports = factory();
    } else {
        root.twgl = factory();
    }
})(this, function() {
    var notrequirebecasebrowserifymessesupjs, notrequirebecasebrowserifymessesup, define;
    (function(undef) {
        var main, req, makeMap, handlers, defined = {}, waiting = {}, config = {}, defining = {}, hasOwn = Object.prototype.hasOwnProperty, aps = [].slice, jsSuffixRegExp = /\.js$/;
        function hasProp(obj, prop) {
            return hasOwn.call(obj, prop);
        }
        function normalize(name, baseName) {
            var nameParts, nameSegment, mapValue, foundMap, lastIndex, foundI, foundStarMap, starI, i, j, part, baseParts = baseName && baseName.split("/"), map = config.map, starMap = map && map["*"] || {};
            if (name && name.charAt(0) === ".") {
                if (baseName) {
                    name = name.split("/");
                    lastIndex = name.length - 1;
                    if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                        name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, "");
                    }
                    name = baseParts.slice(0, baseParts.length - 1).concat(name);
                    for (i = 0; i < name.length; i += 1) {
                        part = name[i];
                        if (part === ".") {
                            name.splice(i, 1);
                            i -= 1;
                        } else if (part === "..") {
                            if (i === 1 && (name[2] === ".." || name[0] === "..")) {
                                break;
                            } else if (i > 0) {
                                name.splice(i - 1, 2);
                                i -= 2;
                            }
                        }
                    }
                    name = name.join("/");
                } else if (name.indexOf("./") === 0) {
                    name = name.substring(2);
                }
            }
            if ((baseParts || starMap) && map) {
                nameParts = name.split("/");
                for (i = nameParts.length; i > 0; i -= 1) {
                    nameSegment = nameParts.slice(0, i).join("/");
                    if (baseParts) {
                        for (j = baseParts.length; j > 0; j -= 1) {
                            mapValue = map[baseParts.slice(0, j).join("/")];
                            if (mapValue) {
                                mapValue = mapValue[nameSegment];
                                if (mapValue) {
                                    foundMap = mapValue;
                                    foundI = i;
                                    break;
                                }
                            }
                        }
                    }
                    if (foundMap) {
                        break;
                    }
                    if (!foundStarMap && starMap && starMap[nameSegment]) {
                        foundStarMap = starMap[nameSegment];
                        starI = i;
                    }
                }
                if (!foundMap && foundStarMap) {
                    foundMap = foundStarMap;
                    foundI = starI;
                }
                if (foundMap) {
                    nameParts.splice(0, foundI, foundMap);
                    name = nameParts.join("/");
                }
            }
            return name;
        }
        function makeRequire(relName, forceSync) {
            return function() {
                var args = aps.call(arguments, 0);
                if (typeof args[0] !== "string" && args.length === 1) {
                    args.push(null);
                }
                return req.apply(undef, args.concat([ relName, forceSync ]));
            };
        }
        function makeNormalize(relName) {
            return function(name) {
                return normalize(name, relName);
            };
        }
        function makeLoad(depName) {
            return function(value) {
                defined[depName] = value;
            };
        }
        function callDep(name) {
            if (hasProp(waiting, name)) {
                var args = waiting[name];
                delete waiting[name];
                defining[name] = true;
                main.apply(undef, args);
            }
            if (!hasProp(defined, name) && !hasProp(defining, name)) {
                throw new Error("No " + name);
            }
            return defined[name];
        }
        function splitPrefix(name) {
            var prefix, index = name ? name.indexOf("!") : -1;
            if (index > -1) {
                prefix = name.substring(0, index);
                name = name.substring(index + 1, name.length);
            }
            return [ prefix, name ];
        }
        makeMap = function(name, relName) {
            var plugin, parts = splitPrefix(name), prefix = parts[0];
            name = parts[1];
            if (prefix) {
                prefix = normalize(prefix, relName);
                plugin = callDep(prefix);
            }
            if (prefix) {
                if (plugin && plugin.normalize) {
                    name = plugin.normalize(name, makeNormalize(relName));
                } else {
                    name = normalize(name, relName);
                }
            } else {
                name = normalize(name, relName);
                parts = splitPrefix(name);
                prefix = parts[0];
                name = parts[1];
                if (prefix) {
                    plugin = callDep(prefix);
                }
            }
            return {
                f: prefix ? prefix + "!" + name : name,
                n: name,
                pr: prefix,
                p: plugin
            };
        };
        function makeConfig(name) {
            return function() {
                return config && config.config && config.config[name] || {};
            };
        }
        handlers = {
            notrequirebecasebrowserifymessesup: function(name) {
                return makeRequire(name);
            },
            exports: function(name) {
                var e = defined[name];
                if (typeof e !== "undefined") {
                    return e;
                } else {
                    return defined[name] = {};
                }
            },
            module: function(name) {
                return {
                    id: name,
                    uri: "",
                    exports: defined[name],
                    config: makeConfig(name)
                };
            }
        };
        main = function(name, deps, callback, relName) {
            var cjsModule, depName, ret, map, i, args = [], callbackType = typeof callback, usingExports;
            relName = relName || name;
            if (callbackType === "undefined" || callbackType === "function") {
                deps = !deps.length && callback.length ? [ "notrequirebecasebrowserifymessesup", "exports", "module" ] : deps;
                for (i = 0; i < deps.length; i += 1) {
                    map = makeMap(deps[i], relName);
                    depName = map.f;
                    if (depName === "notrequirebecasebrowserifymessesup") {
                        args[i] = handlers.notrequirebecasebrowserifymessesup(name);
                    } else if (depName === "exports") {
                        args[i] = handlers.exports(name);
                        usingExports = true;
                    } else if (depName === "module") {
                        cjsModule = args[i] = handlers.module(name);
                    } else if (hasProp(defined, depName) || hasProp(waiting, depName) || hasProp(defining, depName)) {
                        args[i] = callDep(depName);
                    } else if (map.p) {
                        map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                        args[i] = defined[depName];
                    } else {
                        throw new Error(name + " missing " + depName);
                    }
                }
                ret = callback ? callback.apply(defined[name], args) : undefined;
                if (name) {
                    if (cjsModule && cjsModule.exports !== undef && cjsModule.exports !== defined[name]) {
                        defined[name] = cjsModule.exports;
                    } else if (ret !== undef || !usingExports) {
                        defined[name] = ret;
                    }
                }
            } else if (name) {
                defined[name] = callback;
            }
        };
        notrequirebecasebrowserifymessesupjs = notrequirebecasebrowserifymessesup = req = function(deps, callback, relName, forceSync, alt) {
            if (typeof deps === "string") {
                if (handlers[deps]) {
                    return handlers[deps](callback);
                }
                return callDep(makeMap(deps, callback).f);
            } else if (!deps.splice) {
                config = deps;
                if (config.deps) {
                    req(config.deps, config.callback);
                }
                if (!callback) {
                    return;
                }
                if (callback.splice) {
                    deps = callback;
                    callback = relName;
                    relName = null;
                } else {
                    deps = undef;
                }
            }
            callback = callback || function() {};
            if (typeof relName === "function") {
                relName = forceSync;
                forceSync = alt;
            }
            if (forceSync) {
                main(undef, deps, callback, relName);
            } else {
                setTimeout(function() {
                    main(undef, deps, callback, relName);
                }, 4);
            }
            return req;
        };
        req.config = function(cfg) {
            return req(cfg);
        };
        notrequirebecasebrowserifymessesupjs._defined = defined;
        define = function(name, deps, callback) {
            if (typeof name !== "string") {
                throw new Error("See almond README: incorrect module build, no module name");
            }
            if (!deps.splice) {
                callback = deps;
                deps = [];
            }
            if (!hasProp(defined, name) && !hasProp(waiting, name)) {
                waiting[name] = [ name, deps, callback ];
            }
        };
        define.amd = {
            jQuery: true
        };
    })();
    define("node_modules/almond/almond.js", function() {});
    define("twgl/typedarrays", [], function() {
        var gl = undefined;
        var BYTE = 5120;
        var UNSIGNED_BYTE = 5121;
        var SHORT = 5122;
        var UNSIGNED_SHORT = 5123;
        var INT = 5124;
        var UNSIGNED_INT = 5125;
        var FLOAT = 5126;
        function getGLTypeForTypedArray(typedArray) {
            if (typedArray instanceof Int8Array) {
                return BYTE;
            }
            if (typedArray instanceof Uint8Array) {
                return UNSIGNED_BYTE;
            }
            if (typedArray instanceof Uint8ClampedArray) {
                return UNSIGNED_BYTE;
            }
            if (typedArray instanceof Int16Array) {
                return SHORT;
            }
            if (typedArray instanceof Uint16Array) {
                return UNSIGNED_SHORT;
            }
            if (typedArray instanceof Int32Array) {
                return INT;
            }
            if (typedArray instanceof Uint32Array) {
                return UNSIGNED_INT;
            }
            if (typedArray instanceof Float32Array) {
                return FLOAT;
            }
            throw "unsupported typed array type";
        }
        function getTypedArrayTypeForGLType(type) {
            switch (type) {
              case BYTE:
                return Int8Array;

              case UNSIGNED_BYTE:
                return Uint8Array;

              case SHORT:
                return Int16Array;

              case UNSIGNED_SHORT:
                return Uint16Array;

              case INT:
                return Int32Array;

              case UNSIGNED_INT:
                return Uint32Array;

              case FLOAT:
                return Float32Array;

              default:
                throw "unknown gl type";
            }
        }
        function isArrayBuffer(a) {
            return a && a.buffer && a.buffer instanceof ArrayBuffer;
        }
        return {
            getGLTypeForTypedArray: getGLTypeForTypedArray,
            getTypedArrayTypeForGLType: getTypedArrayTypeForGLType,
            isArrayBuffer: isArrayBuffer
        };
    });
    define("twgl/utils", [], function() {
        function shallowCopy(src) {
            var dst = {};
            Object.keys(src).forEach(function(key) {
                dst[key] = src[key];
            });
            return dst;
        }
        function copyNamedProperties(names, src, dst) {
            names.forEach(function(name) {
                var value = src[name];
                if (value !== undefined) {
                    dst[name] = value;
                }
            });
        }
        function copyExistingProperties(src, dst) {
            Object.keys(dst).forEach(function(key) {
                if (dst.hasOwnProperty(key) && src.hasOwnProperty(key)) {
                    dst[key] = src[key];
                }
            });
        }
        function getVersionAsNumber(gl) {
            return parseFloat(gl.getParameter(gl.VERSION).substr(6));
        }
        function isWebGL2(gl) {
            return gl.getParameter(gl.VERSION).indexOf("WebGL 2.0") === 0;
        }
        function isWebGL1(gl) {
            var version = getVersionAsNumber(gl);
            return version <= 1 && version > 0;
        }
        var error = window.console && window.console.error && typeof window.console.error === "function" ? window.console.error.bind(window.console) : function() {};
        var warn = window.console && window.console.warn && typeof window.console.warn === "function" ? window.console.warn.bind(window.console) : function() {};
        return {
            copyExistingProperties: copyExistingProperties,
            copyNamedProperties: copyNamedProperties,
            shallowCopy: shallowCopy,
            isWebGL1: isWebGL1,
            isWebGL2: isWebGL2,
            error: error,
            warn: warn
        };
    });
    define("twgl/attributes", [ "./typedarrays", "./utils" ], function(typedArrays, utils) {
        var gl = undefined;
        var defaults = {
            attribPrefix: ""
        };
        function setAttributePrefix(prefix) {
            defaults.attribPrefix = prefix;
        }
        function setDefaults(newDefaults) {
            utils.copyExistingProperties(newDefaults, defaults);
        }
        function setBufferFromTypedArray(gl, type, buffer, array, drawType) {
            gl.bindBuffer(type, buffer);
            gl.bufferData(type, array, drawType || gl.STATIC_DRAW);
        }
        function createBufferFromTypedArray(gl, typedArray, type, drawType) {
            if (typedArray instanceof WebGLBuffer) {
                return typedArray;
            }
            type = type || gl.ARRAY_BUFFER;
            var buffer = gl.createBuffer();
            setBufferFromTypedArray(gl, type, buffer, typedArray, drawType);
            return buffer;
        }
        function isIndices(name) {
            return name === "indices";
        }
        function getNormalizationForTypedArray(typedArray) {
            if (typedArray instanceof Int8Array) {
                return true;
            }
            if (typedArray instanceof Uint8Array) {
                return true;
            }
            return false;
        }
        function getArray(array) {
            return array.length ? array : array.data;
        }
        function guessNumComponentsFromName(name, length) {
            var numComponents;
            if (name.indexOf("coord") >= 0) {
                numComponents = 2;
            } else if (name.indexOf("color") >= 0) {
                numComponents = 4;
            } else {
                numComponents = 3;
            }
            if (length % numComponents > 0) {
                throw "can not guess numComponents. You should specify it.";
            }
            return numComponents;
        }
        function getNumComponents(array, arrayName) {
            return array.numComponents || array.size || guessNumComponentsFromName(arrayName, getArray(array).length);
        }
        function makeTypedArray(array, name) {
            if (typedArrays.isArrayBuffer(array)) {
                return array;
            }
            if (typedArrays.isArrayBuffer(array.data)) {
                return array.data;
            }
            if (Array.isArray(array)) {
                array = {
                    data: array
                };
            }
            var Type = array.type;
            if (!Type) {
                if (name === "indices") {
                    Type = Uint16Array;
                } else {
                    Type = Float32Array;
                }
            }
            return new Type(array.data);
        }
        function createAttribsFromArrays(gl, arrays) {
            var attribs = {};
            Object.keys(arrays).forEach(function(arrayName) {
                if (!isIndices(arrayName)) {
                    var array = arrays[arrayName];
                    var attribName = array.attrib || array.name || array.attribName || defaults.attribPrefix + arrayName;
                    var typedArray = makeTypedArray(array, arrayName);
                    attribs[attribName] = {
                        buffer: createBufferFromTypedArray(gl, typedArray, undefined, array.drawType),
                        numComponents: getNumComponents(array, arrayName),
                        type: typedArrays.getGLTypeForTypedArray(typedArray),
                        normalize: array.normalize !== undefined ? array.normalize : getNormalizationForTypedArray(typedArray),
                        stride: array.stride || 0,
                        offset: array.offset || 0,
                        drawType: array.drawType
                    };
                }
            });
            return attribs;
        }
        function setAttribInfoBufferFromArray(gl, attribInfo, array, offset) {
            array = makeTypedArray(array);
            if (offset) {
                gl.bindBuffer(gl.ARRAY_BUFFER, attribInfo.buffer);
                gl.bufferSubData(gl.ARRAY_BUFFER, offset, array);
            } else {
                setBufferFromTypedArray(gl, gl.ARRAY_BUFFER, attribInfo.buffer, array, attribInfo.drawType);
            }
        }
        var getNumElementsFromNonIndexedArrays = function() {
            var positionKeys = [ "position", "positions", "a_position" ];
            return function getNumElementsFromNonIndexedArrays(arrays) {
                var key;
                for (var ii = 0; ii < positionKeys.length; ++ii) {
                    key = positionKeys[ii];
                    if (key in arrays) {
                        break;
                    }
                }
                if (ii === positionKeys.length) {
                    key = Object.keys(arrays)[0];
                }
                var array = arrays[key];
                var length = getArray(array).length;
                var numComponents = getNumComponents(array, key);
                var numElements = length / numComponents;
                if (length % numComponents > 0) {
                    throw "numComponents " + numComponents + " not correct for length " + length;
                }
                return numElements;
            };
        }();
        function createBufferInfoFromArrays(gl, arrays) {
            var bufferInfo = {
                attribs: createAttribsFromArrays(gl, arrays)
            };
            var indices = arrays.indices;
            if (indices) {
                indices = makeTypedArray(indices, "indices");
                bufferInfo.indices = createBufferFromTypedArray(gl, indices, gl.ELEMENT_ARRAY_BUFFER);
                bufferInfo.numElements = indices.length;
                bufferInfo.elementType = typedArrays.getGLTypeForTypedArray(indices);
            } else {
                bufferInfo.numElements = getNumElementsFromNonIndexedArrays(arrays);
            }
            return bufferInfo;
        }
        function createBufferFromArray(gl, array, arrayName) {
            var type = arrayName === "indices" ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
            var typedArray = makeTypedArray(array, arrayName);
            return createBufferFromTypedArray(gl, typedArray, type);
        }
        function createBuffersFromArrays(gl, arrays) {
            var buffers = {};
            Object.keys(arrays).forEach(function(key) {
                buffers[key] = createBufferFromArray(gl, arrays[key], key);
            });
            return buffers;
        }
        function createVertexArrayInfo(gl, programInfos, bufferInfo) {
            var vao = gl.createVertexArray();
            gl.bindVertexArray(vao);
            if (!programInfos.length) {
                programInfos = [ programInfos ];
            }
            programInfos.forEach(function(programInfo) {
                twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
            });
            gl.bindVertexArray(null);
            return {
                numElements: bufferInfo.numElements,
                elementType: bufferInfo.elementType,
                vertexArrayObject: vao
            };
        }
        return {
            createAttribsFromArrays: createAttribsFromArrays,
            createBuffersFromArrays: createBuffersFromArrays,
            createBufferFromArray: createBufferFromArray,
            createBufferFromTypedArray: createBufferFromTypedArray,
            createBufferInfoFromArrays: createBufferInfoFromArrays,
            setAttribInfoBufferFromArray: setAttribInfoBufferFromArray,
            createVertexArrayInfo: createVertexArrayInfo,
            setAttributePrefix: setAttributePrefix,
            setDefaults_: setDefaults,
            getNumComponents_: getNumComponents,
            getArray_: getArray
        };
    });
    define("twgl/programs", [ "./utils" ], function(utils) {
        var error = utils.error;
        var warn = utils.warn;
        var FLOAT = 5126;
        var FLOAT_VEC2 = 35664;
        var FLOAT_VEC3 = 35665;
        var FLOAT_VEC4 = 35666;
        var INT = 5124;
        var INT_VEC2 = 35667;
        var INT_VEC3 = 35668;
        var INT_VEC4 = 35669;
        var BOOL = 35670;
        var BOOL_VEC2 = 35671;
        var BOOL_VEC3 = 35672;
        var BOOL_VEC4 = 35673;
        var FLOAT_MAT2 = 35674;
        var FLOAT_MAT3 = 35675;
        var FLOAT_MAT4 = 35676;
        var SAMPLER_2D = 35678;
        var SAMPLER_CUBE = 35680;
        var SAMPLER_3D = 35679;
        var SAMPLER_2D_SHADOW = 35682;
        var FLOAT_MAT2x3 = 35685;
        var FLOAT_MAT2x4 = 35686;
        var FLOAT_MAT3x2 = 35687;
        var FLOAT_MAT3x4 = 35688;
        var FLOAT_MAT4x2 = 35689;
        var FLOAT_MAT4x3 = 35690;
        var SAMPLER_2D_ARRAY = 36289;
        var SAMPLER_2D_ARRAY_SHADOW = 36292;
        var SAMPLER_CUBE_SHADOW = 36293;
        var UNSIGNED_INT = 5125;
        var UNSIGNED_INT_VEC2 = 36294;
        var UNSIGNED_INT_VEC3 = 36295;
        var UNSIGNED_INT_VEC4 = 36296;
        var INT_SAMPLER_2D = 36298;
        var INT_SAMPLER_3D = 36299;
        var INT_SAMPLER_CUBE = 36300;
        var INT_SAMPLER_2D_ARRAY = 36303;
        var UNSIGNED_INT_SAMPLER_2D = 36306;
        var UNSIGNED_INT_SAMPLER_3D = 36307;
        var UNSIGNED_INT_SAMPLER_CUBE = 36308;
        var UNSIGNED_INT_SAMPLER_2D_ARRAY = 36311;
        var TEXTURE_2D = 3553;
        var TEXTURE_CUBE_MAP = 34067;
        var TEXTURE_3D = 32879;
        var TEXTURE_2D_ARRAY = 35866;
        var typeMap = {};
        function getBindPointForSamplerType(gl, type) {
            return typeMap[type].bindPoint;
        }
        function floatSetter(gl, location) {
            return function(v) {
                gl.uniform1f(location, v);
            };
        }
        function floatArraySetter(gl, location) {
            return function(v) {
                gl.uniform1fv(location, v);
            };
        }
        function floatVec2Setter(gl, location) {
            return function(v) {
                gl.uniform2fv(location, v);
            };
        }
        function floatVec3Setter(gl, location) {
            return function(v) {
                gl.uniform3fv(location, v);
            };
        }
        function floatVec4Setter(gl, location) {
            return function(v) {
                gl.uniform4fv(location, v);
            };
        }
        function intSetter(gl, location) {
            return function(v) {
                gl.uniform1i(location, v);
            };
        }
        function intArraySetter(gl, location) {
            return function(v) {
                gl.uniform1iv(location, v);
            };
        }
        function intVec2Setter(gl, location) {
            return function(v) {
                gl.uniform2iv(location, v);
            };
        }
        function intVec3Setter(gl, location) {
            return function(v) {
                gl.uniform3iv(location, v);
            };
        }
        function intVec4Setter(gl, location) {
            return function(v) {
                gl.uniform4iv(location, v);
            };
        }
        function uintSetter(gl, location) {
            return function(v) {
                gl.uniform1ui(location, v);
            };
        }
        function uintArraySetter(gl, location) {
            return function(v) {
                gl.uniform1uiv(location, v);
            };
        }
        function uintVec2Setter(gl, location) {
            return function(v) {
                gl.uniform2uiv(location, v);
            };
        }
        function uintVec3Setter(gl, location) {
            return function(v) {
                gl.uniform3uiv(location, v);
            };
        }
        function uintVec4Setter(gl, location) {
            return function(v) {
                gl.uniform4uiv(location, v);
            };
        }
        function floatMat2Setter(gl, location) {
            return function(v) {
                gl.uniformMatrix2fv(location, false, v);
            };
        }
        function floatMat3Setter(gl, location) {
            return function(v) {
                gl.uniformMatrix3fv(location, false, v);
            };
        }
        function floatMat4Setter(gl, location) {
            return function(v) {
                gl.uniformMatrix4fv(location, false, v);
            };
        }
        function floatMat23Setter(gl, location) {
            return function(v) {
                gl.uniformMatrix2x3fv(location, false, v);
            };
        }
        function floatMat32Setter(gl, location) {
            return function(v) {
                gl.uniformMatrix3x2fv(location, false, v);
            };
        }
        function floatMat24Setter(gl, location) {
            return function(v) {
                gl.uniformMatrix2x4fv(location, false, v);
            };
        }
        function floatMat42Setter(gl, location) {
            return function(v) {
                gl.uniformMatrix4x2fv(location, false, v);
            };
        }
        function floatMat34Setter(gl, location) {
            return function(v) {
                gl.uniformMatrix3x4fv(location, false, v);
            };
        }
        function floatMat43Setter(gl, location) {
            return function(v) {
                gl.uniformMatrix4x3fv(location, false, v);
            };
        }
        function samplerSetter(gl, type, unit, location) {
            var bindPoint = getBindPointForSamplerType(gl, type);
            return function(texture) {
                gl.uniform1i(location, unit);
                gl.activeTexture(gl.TEXTURE0 + unit);
                gl.bindTexture(bindPoint, texture);
            };
        }
        function samplerArraySetter(gl, type, unit, location, size) {
            var bindPoint = getBindPointForSamplerType(gl, type);
            var units = new Int32Array(size);
            for (var ii = 0; ii < size; ++ii) {
                units[ii] = unit + ii;
            }
            return function(textures) {
                gl.uniform1iv(location, units);
                textures.forEach(function(texture, index) {
                    gl.activeTexture(gl.TEXTURE0 + units[index]);
                    gl.bindTexture(bindPoint, texture);
                });
            };
        }
        typeMap[FLOAT] = {
            Type: Float32Array,
            size: 4,
            setter: floatSetter,
            arraySetter: floatArraySetter
        };
        typeMap[FLOAT_VEC2] = {
            Type: Float32Array,
            size: 8,
            setter: floatVec2Setter
        };
        typeMap[FLOAT_VEC3] = {
            Type: Float32Array,
            size: 12,
            setter: floatVec3Setter
        };
        typeMap[FLOAT_VEC4] = {
            Type: Float32Array,
            size: 16,
            setter: floatVec4Setter
        };
        typeMap[INT] = {
            Type: Int32Array,
            size: 4,
            setter: intSetter,
            arraySetter: intArraySetter
        };
        typeMap[INT_VEC2] = {
            Type: Int32Array,
            size: 8,
            setter: intVec2Setter
        };
        typeMap[INT_VEC3] = {
            Type: Int32Array,
            size: 12,
            setter: intVec3Setter
        };
        typeMap[INT_VEC4] = {
            Type: Int32Array,
            size: 16,
            setter: intVec4Setter
        };
        typeMap[UNSIGNED_INT] = {
            Type: Uint32Array,
            size: 4,
            setter: uintSetter,
            arraySetter: uintArraySetter
        };
        typeMap[UNSIGNED_INT_VEC2] = {
            Type: Uint32Array,
            size: 8,
            setter: uintVec2Setter
        };
        typeMap[UNSIGNED_INT_VEC3] = {
            Type: Uint32Array,
            size: 12,
            setter: uintVec3Setter
        };
        typeMap[UNSIGNED_INT_VEC4] = {
            Type: Uint32Array,
            size: 16,
            setter: uintVec4Setter
        };
        typeMap[BOOL] = {
            Type: Uint32Array,
            size: 4,
            setter: intSetter,
            arraySetter: intArraySetter
        };
        typeMap[BOOL_VEC2] = {
            Type: Uint32Array,
            size: 8,
            setter: intVec2Setter
        };
        typeMap[BOOL_VEC3] = {
            Type: Uint32Array,
            size: 12,
            setter: intVec3Setter
        };
        typeMap[BOOL_VEC4] = {
            Type: Uint32Array,
            size: 16,
            setter: intVec4Setter
        };
        typeMap[FLOAT_MAT2] = {
            Type: Float32Array,
            size: 16,
            setter: floatMat2Setter
        };
        typeMap[FLOAT_MAT3] = {
            Type: Float32Array,
            size: 36,
            setter: floatMat3Setter
        };
        typeMap[FLOAT_MAT4] = {
            Type: Float32Array,
            size: 64,
            setter: floatMat4Setter
        };
        typeMap[FLOAT_MAT2x3] = {
            Type: Float32Array,
            size: 24,
            setter: floatMat23Setter
        };
        typeMap[FLOAT_MAT2x4] = {
            Type: Float32Array,
            size: 32,
            setter: floatMat24Setter
        };
        typeMap[FLOAT_MAT3x2] = {
            Type: Float32Array,
            size: 24,
            setter: floatMat32Setter
        };
        typeMap[FLOAT_MAT3x4] = {
            Type: Float32Array,
            size: 48,
            setter: floatMat34Setter
        };
        typeMap[FLOAT_MAT4x2] = {
            Type: Float32Array,
            size: 32,
            setter: floatMat42Setter
        };
        typeMap[FLOAT_MAT4x3] = {
            Type: Float32Array,
            size: 48,
            setter: floatMat43Setter
        };
        typeMap[SAMPLER_2D] = {
            Type: null,
            size: 0,
            setter: samplerSetter,
            arraySetter: samplerArraySetter,
            bindPoint: TEXTURE_2D
        };
        typeMap[SAMPLER_CUBE] = {
            Type: null,
            size: 0,
            setter: samplerSetter,
            arraySetter: samplerArraySetter,
            bindPoint: TEXTURE_CUBE_MAP
        };
        typeMap[SAMPLER_3D] = {
            Type: null,
            size: 0,
            setter: samplerSetter,
            arraySetter: samplerArraySetter,
            bindPoint: TEXTURE_3D
        };
        typeMap[SAMPLER_2D_SHADOW] = {
            Type: null,
            size: 0,
            setter: samplerSetter,
            arraySetter: samplerArraySetter,
            bindPoint: TEXTURE_2D
        };
        typeMap[SAMPLER_2D_ARRAY] = {
            Type: null,
            size: 0,
            setter: samplerSetter,
            arraySetter: samplerArraySetter,
            bindPoint: TEXTURE_2D_ARRAY
        };
        typeMap[SAMPLER_2D_ARRAY_SHADOW] = {
            Type: null,
            size: 0,
            setter: samplerSetter,
            arraySetter: samplerArraySetter,
            bindPoint: TEXTURE_2D_ARRAY
        };
        typeMap[SAMPLER_CUBE_SHADOW] = {
            Type: null,
            size: 0,
            setter: samplerSetter,
            arraySetter: samplerArraySetter,
            bindPoint: TEXTURE_CUBE_MAP
        };
        typeMap[INT_SAMPLER_2D] = {
            Type: null,
            size: 0,
            setter: samplerSetter,
            arraySetter: samplerArraySetter,
            bindPoint: TEXTURE_2D
        };
        typeMap[INT_SAMPLER_3D] = {
            Type: null,
            size: 0,
            setter: samplerSetter,
            arraySetter: samplerArraySetter,
            bindPoint: TEXTURE_3D
        };
        typeMap[INT_SAMPLER_CUBE] = {
            Type: null,
            size: 0,
            setter: samplerSetter,
            arraySetter: samplerArraySetter,
            bindPoint: TEXTURE_CUBE_MAP
        };
        typeMap[INT_SAMPLER_2D_ARRAY] = {
            Type: null,
            size: 0,
            setter: samplerSetter,
            arraySetter: samplerArraySetter,
            bindPoint: TEXTURE_2D_ARRAY
        };
        typeMap[UNSIGNED_INT_SAMPLER_2D] = {
            Type: null,
            size: 0,
            setter: samplerSetter,
            arraySetter: samplerArraySetter,
            bindPoint: TEXTURE_2D
        };
        typeMap[UNSIGNED_INT_SAMPLER_3D] = {
            Type: null,
            size: 0,
            setter: samplerSetter,
            arraySetter: samplerArraySetter,
            bindPoint: TEXTURE_3D
        };
        typeMap[UNSIGNED_INT_SAMPLER_CUBE] = {
            Type: null,
            size: 0,
            setter: samplerSetter,
            arraySetter: samplerArraySetter,
            bindPoint: TEXTURE_CUBE_MAP
        };
        typeMap[UNSIGNED_INT_SAMPLER_2D_ARRAY] = {
            Type: null,
            size: 0,
            setter: samplerSetter,
            arraySetter: samplerArraySetter,
            bindPoint: TEXTURE_2D_ARRAY
        };
        var attrTypeMap = {};
        attrTypeMap[FLOAT_MAT2] = {
            size: 4,
            count: 2
        };
        attrTypeMap[FLOAT_MAT3] = {
            size: 9,
            count: 3
        };
        attrTypeMap[FLOAT_MAT4] = {
            size: 16,
            count: 4
        };
        var gl = undefined;
        function addLineNumbers(src, lineOffset) {
            lineOffset = lineOffset || 0;
            ++lineOffset;
            return src.split("\n").map(function(line, ndx) {
                return ndx + lineOffset + ": " + line;
            }).join("\n");
        }
        var spaceRE = /^[ \t]*\n/;
        function loadShader(gl, shaderSource, shaderType, opt_errorCallback) {
            var errFn = opt_errorCallback || error;
            var shader = gl.createShader(shaderType);
            var lineOffset = 0;
            if (spaceRE.test(shaderSource)) {
                lineOffset = 1;
                shaderSource = shaderSource.replace(spaceRE, "");
            }
            gl.shaderSource(shader, shaderSource);
            gl.compileShader(shader);
            var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
            if (!compiled) {
                var lastError = gl.getShaderInfoLog(shader);
                errFn(addLineNumbers(shaderSource, lineOffset) + "\n*** Error compiling shader: " + lastError);
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        }
        function createProgram(gl, shaders, opt_attribs, opt_locations, opt_errorCallback) {
            if (typeof opt_locations === "function") {
                opt_errorCallback = opt_locations;
                opt_locations = undefined;
            }
            if (typeof opt_attribs === "function") {
                opt_errorCallback = opt_attribs;
                opt_attribs = undefined;
            }
            var errFn = opt_errorCallback || error;
            var program = gl.createProgram();
            shaders.forEach(function(shader) {
                gl.attachShader(program, shader);
            });
            if (opt_attribs) {
                opt_attribs.forEach(function(attrib, ndx) {
                    gl.bindAttribLocation(program, opt_locations ? opt_locations[ndx] : ndx, attrib);
                });
            }
            gl.linkProgram(program);
            var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
            if (!linked) {
                var lastError = gl.getProgramInfoLog(program);
                errFn("Error in program linking:" + lastError);
                gl.deleteProgram(program);
                return null;
            }
            return program;
        }
        function createShaderFromScript(gl, scriptId, opt_shaderType, opt_errorCallback) {
            var shaderSource = "";
            var shaderType;
            var shaderScript = document.getElementById(scriptId);
            if (!shaderScript) {
                throw "*** Error: unknown script element" + scriptId;
            }
            shaderSource = shaderScript.text;
            if (!opt_shaderType) {
                if (shaderScript.type === "x-shader/x-vertex") {
                    shaderType = gl.VERTEX_SHADER;
                } else if (shaderScript.type === "x-shader/x-fragment") {
                    shaderType = gl.FRAGMENT_SHADER;
                } else if (shaderType !== gl.VERTEX_SHADER && shaderType !== gl.FRAGMENT_SHADER) {
                    throw "*** Error: unknown shader type";
                }
            }
            return loadShader(gl, shaderSource, opt_shaderType ? opt_shaderType : shaderType, opt_errorCallback);
        }
        var defaultShaderType = [ "VERTEX_SHADER", "FRAGMENT_SHADER" ];
        function createProgramFromScripts(gl, shaderScriptIds, opt_attribs, opt_locations, opt_errorCallback) {
            var shaders = [];
            for (var ii = 0; ii < shaderScriptIds.length; ++ii) {
                var shader = createShaderFromScript(gl, shaderScriptIds[ii], gl[defaultShaderType[ii]], opt_errorCallback);
                if (!shader) {
                    return null;
                }
                shaders.push(shader);
            }
            return createProgram(gl, shaders, opt_attribs, opt_locations, opt_errorCallback);
        }
        function createProgramFromSources(gl, shaderSources, opt_attribs, opt_locations, opt_errorCallback) {
            var shaders = [];
            for (var ii = 0; ii < shaderSources.length; ++ii) {
                var shader = loadShader(gl, shaderSources[ii], gl[defaultShaderType[ii]], opt_errorCallback);
                if (!shader) {
                    return null;
                }
                shaders.push(shader);
            }
            return createProgram(gl, shaders, opt_attribs, opt_locations, opt_errorCallback);
        }
        function createUniformSetters(gl, program) {
            var textureUnit = 0;
            function createUniformSetter(program, uniformInfo) {
                var location = gl.getUniformLocation(program, uniformInfo.name);
                var isArray = uniformInfo.size > 1 && uniformInfo.name.substr(-3) === "[0]";
                var type = uniformInfo.type;
                var typeInfo = typeMap[type];
                if (!typeInfo) {
                    throw "unknown type: 0x" + type.toString(16);
                }
                if (typeInfo.bindPoint) {
                    var unit = textureUnit;
                    textureUnit += uniformInfo.size;
                    if (isArray) {
                        return typeInfo.arraySetter(gl, type, unit, location, uniformInfo.size);
                    } else {
                        return typeInfo.setter(gl, type, unit, location, uniformInfo.size);
                    }
                } else {
                    if (typeInfo.arraySetter && isArray) {
                        return typeInfo.arraySetter(gl, location);
                    } else {
                        return typeInfo.setter(gl, location);
                    }
                }
            }
            var uniformSetters = {};
            var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
            for (var ii = 0; ii < numUniforms; ++ii) {
                var uniformInfo = gl.getActiveUniform(program, ii);
                if (!uniformInfo) {
                    break;
                }
                var name = uniformInfo.name;
                if (name.substr(-3) === "[0]") {
                    name = name.substr(0, name.length - 3);
                }
                var setter = createUniformSetter(program, uniformInfo);
                uniformSetters[name] = setter;
            }
            return uniformSetters;
        }
        function createUniformBlockSpecFromProgram(gl, program) {
            var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
            var uniformData = [];
            var uniformIndices = [];
            for (var ii = 0; ii < numUniforms; ++ii) {
                uniformIndices.push(ii);
                uniformData.push({});
                var uniformInfo = gl.getActiveUniform(program, ii);
                if (!uniformInfo) {
                    break;
                }
                uniformData[ii].name = uniformInfo.name;
            }
            [ [ "UNIFORM_TYPE", "type" ], [ "UNIFORM_SIZE", "size" ], [ "UNIFORM_BLOCK_INDEX", "blockNdx" ], [ "UNIFORM_OFFSET", "offset" ] ].forEach(function(pair) {
                var pname = pair[0];
                var key = pair[1];
                gl.getActiveUniforms(program, uniformIndices, gl[pname]).forEach(function(value, ndx) {
                    uniformData[ndx][key] = value;
                });
            });
            var blockSpecs = {};
            var numUniformBlocks = gl.getProgramParameter(program, gl.ACTIVE_UNIFORM_BLOCKS);
            for (ii = 0; ii < numUniformBlocks; ++ii) {
                var name = gl.getActiveUniformBlockName(program, ii);
                var blockSpec = {
                    index: ii,
                    usedByVertexShader: gl.getActiveUniformBlockParameter(program, ii, gl.UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER),
                    usedByFragmentShader: gl.getActiveUniformBlockParameter(program, ii, gl.UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER),
                    size: gl.getActiveUniformBlockParameter(program, ii, gl.UNIFORM_BLOCK_DATA_SIZE),
                    uniformIndices: gl.getActiveUniformBlockParameter(program, ii, gl.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES)
                };
                blockSpec.used = blockSpec.usedByVertexSahder || blockSpec.usedByFragmentShader;
                blockSpecs[name] = blockSpec;
            }
            return {
                blockSpecs: blockSpecs,
                uniformData: uniformData
            };
        }
        var arraySuffixRE = /\[\d+\]\.$/;
        function createUniformBlockInfoFromProgram(gl, program, uniformBlockSpec, blockName) {
            var blockSpecs = uniformBlockSpec.blockSpecs;
            var uniformData = uniformBlockSpec.uniformData;
            var blockSpec = blockSpecs[blockName];
            if (!blockSpec) {
                warn("no uniform block object named:", blockName);
                return {
                    name: blockName,
                    uniforms: {}
                };
            }
            var array = new ArrayBuffer(blockSpec.size);
            var buffer = gl.createBuffer();
            var uniformBufferIndex = blockSpec.index;
            gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
            gl.uniformBlockBinding(program, blockSpec.index, uniformBufferIndex);
            var prefix = blockName + ".";
            if (arraySuffixRE.test(prefix)) {
                prefix = prefix.replace(arraySuffixRE, ".");
            }
            var uniforms = {};
            blockSpec.uniformIndices.forEach(function(uniformNdx) {
                var data = uniformData[uniformNdx];
                var typeInfo = typeMap[data.type];
                var Type = typeInfo.Type;
                var length = data.size * typeInfo.size;
                var name = data.name;
                if (name.substr(0, prefix.length) === prefix) {
                    name = name.substr(prefix.length);
                }
                uniforms[name] = new Type(array, data.offset, length / Type.BYTES_PER_ELEMENT);
            });
            return {
                name: blockName,
                array: array,
                asFloat: new Float32Array(array),
                buffer: buffer,
                uniforms: uniforms
            };
        }
        function createUniformBlockInfo(gl, programInfo, blockName) {
            return createUniformBlockInfoFromProgram(gl, programInfo.program, programInfo.uniformBlockSpec, blockName);
        }
        function bindUniformBlock(gl, programInfo, uniformBlockInfo) {
            var uniformBlockSpec = programInfo.uniformBlockSpec || programInfo;
            var blockSpec = uniformBlockSpec.blockSpecs[uniformBlockInfo.name];
            if (blockSpec) {
                var bufferBindIndex = blockSpec.index;
                gl.bindBufferRange(gl.UNIFORM_BUFFER, bufferBindIndex, uniformBlockInfo.buffer, uniformBlockInfo.offset || 0, uniformBlockInfo.array.byteLength);
                return true;
            }
            return false;
        }
        function setUniformBlock(gl, programInfo, uniformBlockInfo) {
            if (bindUniformBlock(gl, programInfo, uniformBlockInfo)) {
                gl.bufferData(gl.UNIFORM_BUFFER, uniformBlockInfo.array, gl.DYNAMIC_DRAW);
            }
        }
        function setBlockUniforms(uniformBlockInfo, values) {
            var uniforms = uniformBlockInfo.uniforms;
            for (var name in values) {
                var array = uniforms[name];
                if (array) {
                    var value = values[name];
                    if (value.length) {
                        array.set(value);
                    } else {
                        array[0] = value;
                    }
                }
            }
        }
        function setUniforms(setters, values) {
            var actualSetters = setters.uniformSetters || setters;
            var numArgs = arguments.length;
            for (var andx = 1; andx < numArgs; ++andx) {
                var vals = arguments[andx];
                if (Array.isArray(vals)) {
                    var numValues = vals.length;
                    for (var ii = 0; ii < numValues; ++ii) {
                        setUniforms(actualSetters, vals[ii]);
                    }
                } else {
                    for (var name in vals) {
                        var setter = actualSetters[name];
                        if (setter) {
                            setter(vals[name]);
                        }
                    }
                }
            }
        }
        function createAttributeSetters(gl, program) {
            var attribSetters = {};
            function createAttribSetter(index) {
                return function(b) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer);
                    gl.enableVertexAttribArray(index);
                    gl.vertexAttribPointer(index, b.numComponents || b.size, b.type || gl.FLOAT, b.normalize || false, b.stride || 0, b.offset || 0);
                };
            }
            function createMatAttribSetter(index, typeInfo) {
                var defaultSize = typeInfo.size;
                var count = typeInfo.count;
                return function(b) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer);
                    var numComponents = b.size || b.numComponents || defaultSize;
                    var size = numComponents / count;
                    var type = b.type || gl.FLOAT;
                    var typeInfo = typeMap[type];
                    var stride = typeInfo.size * numComponents;
                    var normalize = b.normalize || false;
                    var offset = b.offset || 0;
                    var rowOffset = stride / count;
                    for (var i = 0; i < count; ++i) {
                        gl.enableVertexAttribArray(index + i);
                        gl.vertexAttribPointer(index + i, size, type, normalize, stride, offset + rowOffset * i);
                    }
                };
            }
            var numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
            for (var ii = 0; ii < numAttribs; ++ii) {
                var attribInfo = gl.getActiveAttrib(program, ii);
                if (!attribInfo) {
                    break;
                }
                var index = gl.getAttribLocation(program, attribInfo.name);
                var typeInfo = attrTypeMap[attribInfo.type];
                if (typeInfo) {
                    attribSetters[attribInfo.name] = createMatAttribSetter(index, typeInfo);
                } else {
                    attribSetters[attribInfo.name] = createAttribSetter(index);
                }
            }
            return attribSetters;
        }
        function setAttributes(setters, buffers) {
            for (var name in buffers) {
                var setter = setters[name];
                if (setter) {
                    setter(buffers[name]);
                }
            }
        }
        function setBuffersAndAttributes(gl, programInfo, buffers) {
            if (buffers.vertexArrayObject) {
                gl.bindVertexArray(buffers.vertexArrayObject);
            } else {
                setAttributes(programInfo.attribSetters || programInfo, buffers.attribs);
                if (buffers.indices) {
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
                }
            }
        }
        function createProgramInfoFromProgram(gl, program) {
            var uniformSetters = createUniformSetters(gl, program);
            var attribSetters = createAttributeSetters(gl, program);
            var programInfo = {
                program: program,
                uniformSetters: uniformSetters,
                attribSetters: attribSetters
            };
            if (utils.isWebGL2(gl)) {
                programInfo.uniformBlockSpec = createUniformBlockSpecFromProgram(gl, program);
            }
            return programInfo;
        }
        function createProgramInfo(gl, shaderSources, opt_attribs, opt_locations, opt_errorCallback) {
            if (typeof opt_locations === "function") {
                opt_errorCallback = opt_locations;
                opt_locations = undefined;
            }
            if (typeof opt_attribs === "function") {
                opt_errorCallback = opt_attribs;
                opt_attribs = undefined;
            }
            var errFn = opt_errorCallback || error;
            var good = true;
            shaderSources = shaderSources.map(function(source) {
                if (source.indexOf("\n") < 0) {
                    var script = document.getElementById(source);
                    if (!script) {
                        errFn("no element with id: " + source);
                        good = false;
                    } else {
                        source = script.text;
                    }
                }
                return source;
            });
            if (!good) {
                return null;
            }
            var program = createProgramFromSources(gl, shaderSources, opt_attribs, opt_locations, opt_errorCallback);
            if (!program) {
                return null;
            }
            return createProgramInfoFromProgram(gl, program);
        }
        return {
            createAttributeSetters: createAttributeSetters,
            createProgram: createProgram,
            createProgramFromScripts: createProgramFromScripts,
            createProgramFromSources: createProgramFromSources,
            createProgramInfo: createProgramInfo,
            createProgramInfoFromProgram: createProgramInfoFromProgram,
            createUniformSetters: createUniformSetters,
            createUniformBlockSpecFromProgram: createUniformBlockSpecFromProgram,
            createUniformBlockInfoFromProgram: createUniformBlockInfoFromProgram,
            createUniformBlockInfo: createUniformBlockInfo,
            setAttributes: setAttributes,
            setBuffersAndAttributes: setBuffersAndAttributes,
            setUniforms: setUniforms,
            setUniformBlock: setUniformBlock,
            setBlockUniforms: setBlockUniforms,
            bindUniformBlock: bindUniformBlock
        };
    });
    define("twgl/draw", [ "./programs" ], function(programs) {
        function drawBufferInfo(gl, type, bufferInfo, count, offset) {
            var indices = bufferInfo.indices;
            var elementType = bufferInfo.elementType;
            var numElements = count === undefined ? bufferInfo.numElements : count;
            offset = offset === undefined ? 0 : offset;
            if (elementType || indices) {
                gl.drawElements(type, numElements, elementType === undefined ? gl.UNSIGNED_SHORT : bufferInfo.elementType, offset);
            } else {
                gl.drawArrays(type, offset, numElements);
            }
        }
        function drawObjectList(gl, objectsToDraw) {
            var lastUsedProgramInfo = null;
            var lastUsedBufferInfo = null;
            objectsToDraw.forEach(function(object) {
                if (object.active === false) {
                    return;
                }
                var programInfo = object.programInfo;
                var bufferInfo = object.vertexArrayInfo || object.bufferInfo;
                var bindBuffers = false;
                var type = object.type === undefined ? gl.TRIANGLES : object.type;
                if (programInfo !== lastUsedProgramInfo) {
                    lastUsedProgramInfo = programInfo;
                    gl.useProgram(programInfo.program);
                    bindBuffers = true;
                }
                if (bindBuffers || bufferInfo !== lastUsedBufferInfo) {
                    if (lastUsedBufferInfo && lastUsedBufferInfo.vertexArrayObject && !bufferInfo.vertexArrayObject) {
                        gl.bindVertexArray(null);
                    }
                    lastUsedBufferInfo = bufferInfo;
                    programs.setBuffersAndAttributes(gl, programInfo, bufferInfo);
                }
                programs.setUniforms(programInfo, object.uniforms);
                drawBufferInfo(gl, type, bufferInfo, object.count, object.offset);
            });
            if (lastUsedBufferInfo.vertexArrayObject) {
                gl.bindVertexArray(null);
            }
        }
        return {
            drawBufferInfo: drawBufferInfo,
            drawObjectList: drawObjectList
        };
    });
    define("twgl/textures", [ "./typedarrays", "./utils" ], function(typedArrays, utils) {
        var gl = undefined;
        var defaults = {
            textureColor: new Uint8Array([ 128, 192, 255, 255 ]),
            textureOptions: {},
            crossOrigin: undefined
        };
        var isArrayBuffer = typedArrays.isArrayBuffer;
        var ALPHA = 6406;
        var RGB = 6407;
        var RGBA = 6408;
        var LUMINANCE = 6409;
        var LUMINANCE_ALPHA = 6410;
        var REPEAT = 10497;
        var MIRRORED_REPEAT = 33648;
        var NEAREST = 9728;
        var NEAREST_MIPMAP_NEAREST = 9984;
        var LINEAR_MIPMAP_NEAREST = 9985;
        var NEAREST_MIPMAP_LINEAR = 9986;
        var LINEAR_MIPMAP_LINEAR = 9987;
        function setDefaultTextureColor(color) {
            defaults.textureColor = new Uint8Array([ color[0] * 255, color[1] * 255, color[2] * 255, color[3] * 255 ]);
        }
        function setDefaults(newDefaults) {
            utils.copyExistingProperties(newDefaults, defaults);
            if (newDefaults.textureColor) {
                setDefaultTextureColor(newDefaults.textureColor);
            }
        }
        var glEnumToString = function() {
            var enums;
            function init(gl) {
                if (!enums) {
                    enums = {};
                    Object.keys(gl).forEach(function(key) {
                        if (typeof gl[key] === "number") {
                            enums[gl[key]] = key;
                        }
                    });
                }
            }
            return function glEnumToString(gl, value) {
                init();
                return enums[value] || "0x" + value.toString(16);
            };
        }();
        var lastPackState = {};
        function savePackState(gl, options) {
            if (options.colorspaceConversion !== undefined) {
                lastPackState.colorspaceConversion = gl.getParameter(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL);
                gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, options.colorspaceConversion);
            }
            if (options.premultiplyAlpha !== undefined) {
                lastPackState.premultiplyAlpha = gl.getParameter(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL);
                gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, options.premultiplyAlpha);
            }
            if (options.flipY !== undefined) {
                lastPackState.flipY = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, options.flipY);
            }
        }
        function restorePackState(gl, options) {
            if (options.colorspaceConversion !== undefined) {
                gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, lastPackState.colorspaceConversion);
            }
            if (options.premultiplyAlpha !== undefined) {
                gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, lastPackState.premultiplyAlpha);
            }
            if (options.flipY !== undefined) {
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, lastPackState.flipY);
            }
        }
        function setTextureParameters(gl, tex, options) {
            var target = options.target || gl.TEXTURE_2D;
            gl.bindTexture(target, tex);
            if (options.min) {
                gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, options.min);
            }
            if (options.mag) {
                gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, options.mag);
            }
            if (options.wrap) {
                gl.texParameteri(target, gl.TEXTURE_WRAP_S, options.wrap);
                gl.texParameteri(target, gl.TEXTURE_WRAP_T, options.wrap);
                if (target === gl.TEXTURE_3D) {
                    gl.texParameteri(target, gl.TEXTURE_WRAP_R, options.wrap);
                }
            }
            if (options.wrapR) {
                gl.texParameteri(target, gl.TEXTURE_WRAP_R, options.wrapR);
            }
            if (options.wrapS) {
                gl.texParameteri(target, gl.TEXTURE_WRAP_S, options.wrapS);
            }
            if (options.wrapT) {
                gl.texParameteri(target, gl.TEXTURE_WRAP_T, options.wrapT);
            }
            if (options.minLod) {
                gl.texParameteri(target, gl.TEXTURE_MIN_LOD, options.minLod);
            }
            if (options.maxLod) {
                gl.texParameteri(target, gl.TEXTURE_MAX_LOD, options.maxLod);
            }
            if (options.baseLevel) {
                gl.texParameteri(target, gl.TEXTURE_BASE_LEVEL, options.baseLevel);
            }
            if (options.maxLevel) {
                gl.texParameteri(target, gl.TEXTURE_MAX_LEVEL, options.maxLevel);
            }
        }
        function make1Pixel(color) {
            color = color || defaults.textureColor;
            if (isArrayBuffer(color)) {
                return color;
            }
            return new Uint8Array([ color[0] * 255, color[1] * 255, color[2] * 255, color[3] * 255 ]);
        }
        function isPowerOf2(value) {
            return (value & value - 1) === 0;
        }
        function setTextureFilteringForSize(gl, tex, options, width, height) {
            options = options || defaults.textureOptions;
            var target = options.target || gl.TEXTURE_2D;
            width = width || options.width;
            height = height || options.height;
            gl.bindTexture(target, tex);
            if (!isPowerOf2(width) || !isPowerOf2(height)) {
                gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            } else {
                gl.generateMipmap(target);
            }
        }
        function getCubeFaceOrder(gl, options) {
            options = options || {};
            return options.cubeFaceOrder || [ gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z ];
        }
        function getCubeFacesWithNdx(gl, options) {
            var faces = getCubeFaceOrder(gl, options);
            var facesWithNdx = faces.map(function(face, ndx) {
                return {
                    face: face,
                    ndx: ndx
                };
            });
            facesWithNdx.sort(function(a, b) {
                return a.face - b.face;
            });
            return facesWithNdx;
        }
        var setTextureFromElement = function() {
            var ctx = document.createElement("canvas").getContext("2d");
            return function setTextureFromElement(gl, tex, element, options) {
                options = options || defaults.textureOptions;
                var target = options.target || gl.TEXTURE_2D;
                var width = element.width;
                var height = element.height;
                var format = options.format || gl.RGBA;
                var internalFormat = options.internalFormat || format;
                var type = options.type || gl.UNSIGNED_BYTE;
                savePackState(gl, options);
                gl.bindTexture(target, tex);
                if (target === gl.TEXTURE_CUBE_MAP) {
                    var imgWidth = element.width;
                    var imgHeight = element.height;
                    var size;
                    var slices;
                    if (imgWidth / 6 === imgHeight) {
                        size = imgHeight;
                        slices = [ 0, 0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0 ];
                    } else if (imgHeight / 6 === imgWidth) {
                        size = imgWidth;
                        slices = [ 0, 0, 0, 1, 0, 2, 0, 3, 0, 4, 0, 5 ];
                    } else if (imgWidth / 3 === imgHeight / 2) {
                        size = imgWidth / 3;
                        slices = [ 0, 0, 1, 0, 2, 0, 0, 1, 1, 1, 2, 1 ];
                    } else if (imgWidth / 2 === imgHeight / 3) {
                        size = imgWidth / 2;
                        slices = [ 0, 0, 1, 0, 0, 1, 1, 1, 0, 2, 1, 2 ];
                    } else {
                        throw "can't figure out cube map from element: " + (element.src ? element.src : element.nodeName);
                    }
                    ctx.canvas.width = size;
                    ctx.canvas.height = size;
                    width = size;
                    height = size;
                    getCubeFacesWithNdx(gl, options).forEach(function(f) {
                        var xOffset = slices[f.ndx * 2 + 0] * size;
                        var yOffset = slices[f.ndx * 2 + 1] * size;
                        ctx.drawImage(element, xOffset, yOffset, size, size, 0, 0, size, size);
                        gl.texImage2D(f.face, 0, internalFormat, format, type, ctx.canvas);
                    });
                    ctx.canvas.width = 1;
                    ctx.canvas.height = 1;
                } else if (target === gl.TEXTURE_3D) {
                    var smallest = Math.min(element.width, element.height);
                    var largest = Math.max(element.width, element.height);
                    var depth = largest / smallest;
                    if (depth % 1 !== 0) {
                        throw "can not compute 3D dimensions of element";
                    }
                    var xMult = element.width === largest ? 1 : 0;
                    var yMult = element.height === largest ? 1 : 0;
                    gl.texImage3D(target, 0, internalFormat, smallest, smallest, smallest, 0, format, type, null);
                    ctx.canvas.width = smallest;
                    ctx.canvas.height = smallest;
                    for (var d = 0; d < depth; ++d) {
                        var srcX = d * smallest * xMult;
                        var srcY = d * smallest * yMult;
                        var srcW = smallest;
                        var srcH = smallest;
                        var dstX = 0;
                        var dstY = 0;
                        var dstW = smallest;
                        var dstH = smallest;
                        ctx.drawImage(element, srcX, srcY, srcW, srcH, dstX, dstY, dstW, dstH);
                        gl.texSubImage3D(target, 0, 0, 0, d, format, type, ctx.canvas);
                    }
                    ctx.canvas.width = 0;
                    ctx.canvas.height = 0;
                } else {
                    gl.texImage2D(target, 0, internalFormat, format, type, element);
                }
                restorePackState(gl, options);
                if (options.auto !== false) {
                    setTextureFilteringForSize(gl, tex, options, width, height);
                }
                setTextureParameters(gl, tex, options);
            };
        }();
        function noop() {}
        function loadImage(url, crossOrigin, callback) {
            callback = callback || noop;
            var img = new Image();
            crossOrigin = crossOrigin !== undefined ? crossOrigin : defaults.crossOrigin;
            if (crossOrigin !== undefined) {
                img.crossOrigin = crossOrigin;
            }
            function clearEventHandlers() {
                img.removeEventListener("error", onError);
                img.removeEventListener("load", onLoad);
                img = null;
            }
            function onError() {
                var msg = "couldn't load image: " + url;
                utils.error(msg);
                callback(msg, img);
                clearEventHandlers();
            }
            function onLoad() {
                callback(null, img);
                clearEventHandlers();
            }
            img.addEventListener("error", onError);
            img.addEventListener("load", onLoad);
            img.src = url;
            return img;
        }
        function setTextureTo1PixelColor(gl, tex, options) {
            options = options || defaults.textureOptions;
            var target = options.target || gl.TEXTURE_2D;
            gl.bindTexture(target, tex);
            if (options.color === false) {
                return;
            }
            var color = make1Pixel(options.color);
            if (target === gl.TEXTURE_CUBE_MAP) {
                for (var ii = 0; ii < 6; ++ii) {
                    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + ii, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, color);
                }
            } else if (target === gl.TEXTURE_3D) {
                gl.texImage3D(target, 0, gl.RGBA, 1, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, color);
            } else {
                gl.texImage2D(target, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, color);
            }
        }
        function loadTextureFromUrl(gl, tex, options, callback) {
            callback = callback || noop;
            options = options || defaults.textureOptions;
            setTextureTo1PixelColor(gl, tex, options);
            options = utils.shallowCopy(options);
            var img = loadImage(options.src, options.crossOrigin, function(err, img) {
                if (err) {
                    callback(err, tex, img);
                } else {
                    setTextureFromElement(gl, tex, img, options);
                    callback(null, tex, img);
                }
            });
            return img;
        }
        function loadCubemapFromUrls(gl, tex, options, callback) {
            callback = callback || noop;
            var urls = options.src;
            if (urls.length !== 6) {
                throw "there must be 6 urls for a cubemap";
            }
            var format = options.format || gl.RGBA;
            var type = options.type || gl.UNSIGNED_BYTE;
            var target = options.target || gl.TEXTURE_2D;
            if (target !== gl.TEXTURE_CUBE_MAP) {
                throw "target must be TEXTURE_CUBE_MAP";
            }
            setTextureTo1PixelColor(gl, tex, options);
            options = utils.shallowCopy(options);
            var numToLoad = 6;
            var errors = [];
            var imgs;
            var faces = getCubeFaceOrder(gl, options);
            function uploadImg(faceTarget) {
                return function(err, img) {
                    --numToLoad;
                    if (err) {
                        errors.push(err);
                    } else {
                        if (img.width !== img.height) {
                            errors.push("cubemap face img is not a square: " + img.src);
                        } else {
                            savePackState(gl, options);
                            gl.bindTexture(target, tex);
                            if (numToLoad === 5) {
                                getCubeFaceOrder(gl).forEach(function(otherTarget) {
                                    gl.texImage2D(otherTarget, 0, format, format, type, img);
                                });
                            } else {
                                gl.texImage2D(faceTarget, 0, format, format, type, img);
                            }
                            restorePackState(gl, options);
                            gl.generateMipmap(target);
                        }
                    }
                    if (numToLoad === 0) {
                        callback(errors.length ? errors : undefined, imgs, tex);
                    }
                };
            }
            imgs = urls.map(function(url, ndx) {
                return loadImage(url, options.crossOrigin, uploadImg(faces[ndx]));
            });
        }
        function getNumComponentsForFormat(format) {
            switch (format) {
              case ALPHA:
              case LUMINANCE:
                return 1;

              case LUMINANCE_ALPHA:
                return 2;

              case RGB:
                return 3;

              case RGBA:
                return 4;

              default:
                throw "unknown type: " + format;
            }
        }
        function getTextureTypeForArrayType(gl, src) {
            if (isArrayBuffer(src)) {
                return typedArrays.getGLTypeForTypedArray(src);
            }
            return gl.UNSIGNED_BYTE;
        }
        function guessDimensions(gl, target, width, height, numElements) {
            if (numElements % 1 !== 0) {
                throw "can't guess dimensions";
            }
            if (!width && !height) {
                var size = Math.sqrt(numElements / (target === gl.TEXTURE_CUBE_MAP ? 6 : 1));
                if (size % 1 === 0) {
                    width = size;
                    height = size;
                } else {
                    width = numElements;
                    height = 1;
                }
            } else if (!height) {
                height = numElements / width;
                if (height % 1) {
                    throw "can't guess dimensions";
                }
            } else if (!width) {
                width = numElements / height;
                if (width % 1) {
                    throw "can't guess dimensions";
                }
            }
            return {
                width: width,
                height: height
            };
        }
        function setTextureFromArray(gl, tex, src, options) {
            options = options || defaults.textureOptions;
            var target = options.target || gl.TEXTURE_2D;
            gl.bindTexture(target, tex);
            var width = options.width;
            var height = options.height;
            var depth = options.depth;
            var format = options.format || gl.RGBA;
            var internalFormat = options.internalFormat || format;
            var type = options.type || getTextureTypeForArrayType(gl, src);
            var numComponents = getNumComponentsForFormat(format);
            var numElements = src.length / numComponents;
            if (numElements % 1) {
                throw "length wrong size for format: " + glEnumToString(gl, format);
            }
            var dimensions;
            if (target === gl.TEXTURE_3D) {
                if (!width && !height && !depth) {
                    var size = Math.cbrt(numElements);
                    if (size % 1 !== 0) {
                        throw "can't guess cube size of array of numElements: " + numElements;
                    }
                    width = size;
                    height = size;
                    depth = size;
                } else if (width && (!height || !depth)) {
                    dimensions = guessDimensions(gl, target, height, depth, numElements / width);
                    height = dimensions.width;
                    depth = dimensions.height;
                } else if (height && (!width || !depth)) {
                    dimensions = guessDimensions(gl, target, width, depth, numElements / height);
                    width = dimensions.width;
                    depth = dimensions.height;
                } else {
                    dimensions = guessDimensions(gl, target, width, height, numElements / depth);
                    width = dimensions.width;
                    height = dimensions.height;
                }
            } else {
                dimensions = guessDimensions(gl, target, width, height, numElements);
                width = dimensions.width;
                height = dimensions.height;
            }
            if (!isArrayBuffer(src)) {
                var Type = typedArrays.getTypedArrayTypeForGLType(type);
                src = new Type(src);
            } else {
                if (src instanceof Uint8ClampedArray) {
                    src = new Uint8Array(src.buffer);
                }
            }
            gl.pixelStorei(gl.UNPACK_ALIGNMENT, options.unpackAlignment || 1);
            savePackState(gl, options);
            if (target === gl.TEXTURE_CUBE_MAP) {
                var faceSize = numElements / 6 * numComponents;
                getCubeFacesWithNdx(gl, options).forEach(function(f) {
                    var offset = faceSize * f.ndx;
                    var data = src.subarray(offset, offset + faceSize);
                    gl.texImage2D(f.face, 0, internalFormat, width, height, 0, format, type, data);
                });
            } else if (target === gl.TEXTURE_3D) {
                gl.texImage3D(target, 0, internalFormat, width, height, depth, 0, format, type, src);
            } else {
                gl.texImage2D(target, 0, internalFormat, width, height, 0, format, type, src);
            }
            restorePackState(gl, options);
            return {
                width: width,
                height: height,
                depth: depth
            };
        }
        function setEmptyTexture(gl, tex, options) {
            var target = options.target || gl.TEXTURE_2D;
            gl.bindTexture(target, tex);
            var format = options.format || gl.RGBA;
            var internalFormat = options.internalFormat || format;
            var type = options.type || gl.UNSIGNED_BYTE;
            savePackState(gl, options);
            if (target === gl.TEXTURE_CUBE_MAP) {
                for (var ii = 0; ii < 6; ++ii) {
                    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + ii, 0, internalFormat, options.width, options.height, 0, format, type, null);
                }
            } else if (target === gl.TEXTURE_3D) {
                gl.texImage3D(target, 0, internalFormat, options.width, options.height, options.depth, 0, format, type, null);
            } else {
                gl.texImage2D(target, 0, internalFormat, options.width, options.height, 0, format, type, null);
            }
            restorePackState(gl, options);
        }
        function createTexture(gl, options, callback) {
            callback = callback || noop;
            options = options || defaults.textureOptions;
            var tex = gl.createTexture();
            var target = options.target || gl.TEXTURE_2D;
            var width = options.width || 1;
            var height = options.height || 1;
            gl.bindTexture(target, tex);
            if (target === gl.TEXTURE_CUBE_MAP) {
                gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            }
            var src = options.src;
            if (src) {
                if (typeof src === "function") {
                    src = src(gl, options);
                }
                if (typeof src === "string") {
                    loadTextureFromUrl(gl, tex, options, callback);
                } else if (isArrayBuffer(src) || Array.isArray(src) && (typeof src[0] === "number" || Array.isArray(src[0]) || isArrayBuffer(src[0]))) {
                    var dimensions = setTextureFromArray(gl, tex, src, options);
                    width = dimensions.width;
                    height = dimensions.height;
                } else if (Array.isArray(src) && typeof src[0] === "string") {
                    loadCubemapFromUrls(gl, tex, options, callback);
                } else if (src instanceof HTMLElement) {
                    setTextureFromElement(gl, tex, src, options);
                    width = src.width;
                    height = src.height;
                } else {
                    throw "unsupported src type";
                }
            } else {
                setEmptyTexture(gl, tex, options);
            }
            if (options.auto !== false) {
                setTextureFilteringForSize(gl, tex, options, width, height);
            }
            setTextureParameters(gl, tex, options);
            return tex;
        }
        function resizeTexture(gl, tex, options, width, height) {
            width = width || options.width;
            height = height || options.height;
            var target = options.target || gl.TEXTURE_2D;
            gl.bindTexture(target, tex);
            var format = options.format || gl.RGBA;
            var type;
            var src = options.src;
            if (!src) {
                type = options.type || gl.UNSIGNED_BYTE;
            } else if (isArrayBuffer(src) || Array.isArray(src) && typeof src[0] === "number") {
                type = options.type || getTextureTypeForArrayType(gl, src);
            } else {
                type = options.type || gl.UNSIGNED_BYTE;
            }
            if (target === gl.TEXTURE_CUBE_MAP) {
                for (var ii = 0; ii < 6; ++ii) {
                    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + ii, 0, format, width, height, 0, format, type, null);
                }
            } else {
                gl.texImage2D(target, 0, format, width, height, 0, format, type, null);
            }
        }
        function isAsyncSrc(src) {
            return typeof src === "string" || Array.isArray(src) && typeof src[0] === "string";
        }
        function createTextures(gl, textureOptions, callback) {
            callback = callback || noop;
            var numDownloading = 0;
            var errors = [];
            var textures = {};
            var images = {};
            function callCallbackIfReady() {
                if (numDownloading === 0) {
                    setTimeout(function() {
                        callback(errors.length ? errors : undefined, textures, images);
                    }, 0);
                }
            }
            Object.keys(textureOptions).forEach(function(name) {
                var options = textureOptions[name];
                var onLoadFn;
                if (isAsyncSrc(options.src)) {
                    onLoadFn = function(err, tex, img) {
                        images[name] = img;
                        --numDownloading;
                        if (err) {
                            errors.push(err);
                        }
                        callCallbackIfReady();
                    };
                    ++numDownloading;
                }
                textures[name] = createTexture(gl, options, onLoadFn);
            });
            callCallbackIfReady();
            return textures;
        }
        return {
            setDefaults_: setDefaults,
            createTexture: createTexture,
            setEmptyTexture: setEmptyTexture,
            setTextureFromArray: setTextureFromArray,
            loadTextureFromUrl: loadTextureFromUrl,
            setTextureFromElement: setTextureFromElement,
            setTextureFilteringForSize: setTextureFilteringForSize,
            setTextureParameters: setTextureParameters,
            setDefaultTextureColor: setDefaultTextureColor,
            createTextures: createTextures,
            resizeTexture: resizeTexture,
            getNumComponentsForFormat: getNumComponentsForFormat
        };
    });
    define("twgl/framebuffers", [ "./textures", "./utils" ], function(textures, utils) {
        var gl = undefined;
        var UNSIGNED_BYTE = 5121;
        var DEPTH_COMPONENT = 6402;
        var RGBA = 6408;
        var RGBA4 = 32854;
        var RGB5_A1 = 32855;
        var RGB565 = 36194;
        var DEPTH_COMPONENT16 = 33189;
        var STENCIL_INDEX = 6401;
        var STENCIL_INDEX8 = 36168;
        var DEPTH_STENCIL = 34041;
        var COLOR_ATTACHMENT0 = 36064;
        var DEPTH_ATTACHMENT = 36096;
        var STENCIL_ATTACHMENT = 36128;
        var DEPTH_STENCIL_ATTACHMENT = 33306;
        var REPEAT = 10497;
        var CLAMP_TO_EDGE = 33071;
        var MIRRORED_REPEAT = 33648;
        var NEAREST = 9728;
        var LINEAR = 9729;
        var NEAREST_MIPMAP_NEAREST = 9984;
        var LINEAR_MIPMAP_NEAREST = 9985;
        var NEAREST_MIPMAP_LINEAR = 9986;
        var LINEAR_MIPMAP_LINEAR = 9987;
        var defaultAttachments = [ {
            format: RGBA,
            type: UNSIGNED_BYTE,
            min: LINEAR,
            wrap: CLAMP_TO_EDGE
        }, {
            format: DEPTH_STENCIL
        } ];
        var attachmentsByFormat = {};
        attachmentsByFormat[DEPTH_STENCIL] = DEPTH_STENCIL_ATTACHMENT;
        attachmentsByFormat[STENCIL_INDEX] = STENCIL_ATTACHMENT;
        attachmentsByFormat[STENCIL_INDEX8] = STENCIL_ATTACHMENT;
        attachmentsByFormat[DEPTH_COMPONENT] = DEPTH_ATTACHMENT;
        attachmentsByFormat[DEPTH_COMPONENT16] = DEPTH_ATTACHMENT;
        function getAttachmentPointForFormat(format) {
            return attachmentsByFormat[format];
        }
        var renderbufferFormats = {};
        renderbufferFormats[RGBA4] = true;
        renderbufferFormats[RGB5_A1] = true;
        renderbufferFormats[RGB565] = true;
        renderbufferFormats[DEPTH_STENCIL] = true;
        renderbufferFormats[DEPTH_COMPONENT16] = true;
        renderbufferFormats[STENCIL_INDEX] = true;
        renderbufferFormats[STENCIL_INDEX8] = true;
        function isRenderbufferFormat(format) {
            return renderbufferFormats[format];
        }
        function createFramebufferInfo(gl, attachments, width, height) {
            var target = gl.FRAMEBUFFER;
            var fb = gl.createFramebuffer();
            gl.bindFramebuffer(target, fb);
            width = width || gl.drawingBufferWidth;
            height = height || gl.drawingBufferHeight;
            attachments = attachments || defaultAttachments;
            var colorAttachmentCount = 0;
            var framebufferInfo = {
                framebuffer: fb,
                attachments: [],
                width: width,
                height: height
            };
            attachments.forEach(function(attachmentOptions) {
                var attachment = attachmentOptions.attachment;
                var format = attachmentOptions.format;
                var attachmentPoint = getAttachmentPointForFormat(format);
                if (!attachmentPoint) {
                    attachmentPoint = COLOR_ATTACHMENT0 + colorAttachmentCount++;
                }
                if (!attachment) {
                    if (isRenderbufferFormat(format)) {
                        attachment = gl.createRenderbuffer();
                        gl.bindRenderbuffer(gl.RENDERBUFFER, attachment);
                        gl.renderbufferStorage(gl.RENDERBUFFER, format, width, height);
                    } else {
                        var textureOptions = utils.shallowCopy(attachmentOptions);
                        textureOptions.width = width;
                        textureOptions.height = height;
                        if (textureOptions.auto === undefined) {
                            textureOptions.auto = false;
                            textureOptions.min = textureOptions.min || gl.LINEAR;
                            textureOptions.mag = textureOptions.mag || gl.LINEAR;
                            textureOptions.wrapS = textureOptions.wrapS || textureOptions.wrap || gl.CLAMP_TO_EDGE;
                            textureOptions.wrapT = textureOptions.wrapT || textureOptions.wrap || gl.CLAMP_TO_EDGE;
                        }
                        attachment = textures.createTexture(gl, textureOptions);
                    }
                }
                if (attachment instanceof WebGLRenderbuffer) {
                    gl.framebufferRenderbuffer(target, attachmentPoint, gl.RENDERBUFFER, attachment);
                } else if (attachment instanceof WebGLTexture) {
                    gl.framebufferTexture2D(target, attachmentPoint, attachmentOptions.texTarget || gl.TEXTURE_2D, attachment, attachmentOptions.level || 0);
                } else {
                    throw "unknown attachment type";
                }
                framebufferInfo.attachments.push(attachment);
            });
            return framebufferInfo;
        }
        function resizeFramebufferInfo(gl, framebufferInfo, attachments, width, height) {
            width = width || gl.drawingBufferWidth;
            height = height || gl.drawingBufferHeight;
            framebufferInfo.width = width;
            framebufferInfo.height = height;
            attachments = attachments || defaultAttachments;
            attachments.forEach(function(attachmentOptions, ndx) {
                var attachment = framebufferInfo.attachments[ndx];
                var format = attachmentOptions.format;
                if (attachment instanceof WebGLRenderbuffer) {
                    gl.bindRenderbuffer(gl.RENDERBUFFER, attachment);
                    gl.renderbufferStorage(gl.RENDERBUFFER, format, width, height);
                } else if (attachment instanceof WebGLTexture) {
                    textures.resizeTexture(gl, attachment, attachmentOptions, width, height);
                } else {
                    throw "unknown attachment type";
                }
            });
        }
        function bindFramebufferInfo(gl, framebufferInfo, target) {
            target = target || gl.FRAMEBUFFER;
            if (framebufferInfo) {
                gl.bindFramebuffer(target, framebufferInfo.framebuffer);
                gl.viewport(0, 0, framebufferInfo.width, framebufferInfo.height);
            } else {
                gl.bindFramebuffer(target, null);
                gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            }
        }
        return {
            bindFramebufferInfo: bindFramebufferInfo,
            createFramebufferInfo: createFramebufferInfo,
            resizeFramebufferInfo: resizeFramebufferInfo
        };
    });
    define("twgl/twgl", [ "./attributes", "./draw", "./framebuffers", "./programs", "./textures", "./typedarrays", "./utils" ], function(attributes, draw, framebuffers, programs, textures, typedArrays, utils) {
        var gl = undefined;
        var defaults = {
            enableVertexArrayObjects: true
        };
        function setDefaults(newDefaults) {
            utils.copyExistingProperties(newDefaults, defaults);
            attributes.setDefaults_(newDefaults);
            textures.setDefaults_(newDefaults);
        }
        function addVertexArrayObjectSupport(gl) {
            if (!gl || !defaults.enableVertexArrayObjects) {
                return;
            }
            if (utils.isWebGL1(gl)) {
                var ext = gl.getExtension("OES_vertex_array_object");
                if (ext) {
                    gl.createVertexArray = function() {
                        return ext.createVertexArrayOES();
                    };
                    gl.deleteVertexArray = function(v) {
                        ext.deleteVertexArrayOES(v);
                    };
                    gl.isVertexArray = function(v) {
                        return ext.isVertexArrayOES(v);
                    };
                    gl.bindVertexArray = function(v) {
                        ext.bindVertexArrayOES(v);
                    };
                    gl.VERTEX_ARRAY_BINDING = ext.VERTEX_ARRAY_BINDING_OES;
                }
            }
        }
        function create3DContext(canvas, opt_attribs) {
            var names = [ "webgl", "experimental-webgl" ];
            var context = null;
            for (var ii = 0; ii < names.length; ++ii) {
                try {
                    context = canvas.getContext(names[ii], opt_attribs);
                } catch (e) {}
                if (context) {
                    break;
                }
            }
            return context;
        }
        function getWebGLContext(canvas, opt_attribs) {
            var gl = create3DContext(canvas, opt_attribs);
            addVertexArrayObjectSupport(gl);
            return gl;
        }
        function createContext(canvas, opt_attribs) {
            var names = [ "webgl2", "experimental-webgl2", "webgl", "experimental-webgl" ];
            var context = null;
            for (var ii = 0; ii < names.length; ++ii) {
                try {
                    context = canvas.getContext(names[ii], opt_attribs);
                } catch (e) {}
                if (context) {
                    break;
                }
            }
            return context;
        }
        function getContext(canvas, opt_attribs) {
            var gl = createContext(canvas, opt_attribs);
            addVertexArrayObjectSupport(gl);
            return gl;
        }
        function resizeCanvasToDisplaySize(canvas, multiplier) {
            multiplier = multiplier || 1;
            multiplier = Math.max(1, multiplier);
            var width = canvas.clientWidth * multiplier | 0;
            var height = canvas.clientHeight * multiplier | 0;
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
                return true;
            }
            return false;
        }
        var api = {
            getContext: getContext,
            getWebGLContext: getWebGLContext,
            isWebGL1: utils.isWebGL1,
            isWebGL2: utils.isWebGL2,
            resizeCanvasToDisplaySize: resizeCanvasToDisplaySize,
            setDefaults: setDefaults
        };
        function notPrivate(name) {
            return name[name.length - 1] !== "_";
        }
        function copyPublicProperties(src, dst) {
            Object.keys(src).filter(notPrivate).forEach(function(key) {
                dst[key] = src[key];
            });
            return dst;
        }
        var apis = {
            attributes: attributes,
            draw: draw,
            framebuffers: framebuffers,
            programs: programs,
            textures: textures,
            typedArrays: typedArrays
        };
        Object.keys(apis).forEach(function(name) {
            var srcApi = apis[name];
            copyPublicProperties(srcApi, api);
            api[name] = copyPublicProperties(srcApi, {});
        });
        return api;
    });
    define("twgl/v3", [], function() {
        var VecType = Float32Array;
        function setDefaultType(ctor) {
            var oldType = VecType;
            VecType = ctor;
            return oldType;
        }
        function create(x, y, z) {
            var dst = new VecType(3);
            if (x) {
                dst[0] = x;
            }
            if (y) {
                dst[1] = y;
            }
            if (z) {
                dst[2] = z;
            }
            return dst;
        }
        function add(a, b, dst) {
            dst = dst || new VecType(3);
            dst[0] = a[0] + b[0];
            dst[1] = a[1] + b[1];
            dst[2] = a[2] + b[2];
            return dst;
        }
        function subtract(a, b, dst) {
            dst = dst || new VecType(3);
            dst[0] = a[0] - b[0];
            dst[1] = a[1] - b[1];
            dst[2] = a[2] - b[2];
            return dst;
        }
        function lerp(a, b, t, dst) {
            dst = dst || new VecType(3);
            dst[0] = (1 - t) * a[0] + t * b[0];
            dst[1] = (1 - t) * a[1] + t * b[1];
            dst[2] = (1 - t) * a[2] + t * b[2];
            return dst;
        }
        function mulScalar(v, k, dst) {
            dst = dst || new VecType(3);
            dst[0] = v[0] * k;
            dst[1] = v[1] * k;
            dst[2] = v[2] * k;
            return dst;
        }
        function divScalar(v, k, dst) {
            dst = dst || new VecType(3);
            dst[0] = v[0] / k;
            dst[1] = v[1] / k;
            dst[2] = v[2] / k;
            return dst;
        }
        function cross(a, b, dst) {
            dst = dst || new VecType(3);
            dst[0] = a[1] * b[2] - a[2] * b[1];
            dst[1] = a[2] * b[0] - a[0] * b[2];
            dst[2] = a[0] * b[1] - a[1] * b[0];
            return dst;
        }
        function dot(a, b) {
            return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
        }
        function length(v) {
            return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        }
        function lengthSq(v) {
            return v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
        }
        function normalize(a, dst) {
            dst = dst || new VecType(3);
            var lenSq = a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
            var len = Math.sqrt(lenSq);
            if (len > 1e-5) {
                dst[0] = a[0] / len;
                dst[1] = a[1] / len;
                dst[2] = a[2] / len;
            } else {
                dst[0] = 0;
                dst[1] = 0;
                dst[2] = 0;
            }
            return dst;
        }
        function negate(v, dst) {
            dst = dst || new VecType(3);
            dst[0] = -v[0];
            dst[1] = -v[1];
            dst[2] = -v[2];
            return dst;
        }
        function copy(v, dst) {
            dst = dst || new VecType(3);
            dst[0] = v[0];
            dst[1] = v[1];
            dst[2] = v[2];
            return dst;
        }
        function multiply(a, b, dst) {
            dst = dst || new VecType(3);
            dst[0] = a[0] * b[0];
            dst[1] = a[1] * b[1];
            dst[2] = a[2] * b[2];
            return dst;
        }
        function divide(a, b, dst) {
            dst = dst || new VecType(3);
            dst[0] = a[0] / b[0];
            dst[1] = a[1] / b[1];
            dst[2] = a[2] / b[2];
            return dst;
        }
        return {
            add: add,
            copy: copy,
            create: create,
            cross: cross,
            divide: divide,
            divScalar: divScalar,
            dot: dot,
            lerp: lerp,
            length: length,
            lengthSq: lengthSq,
            mulScalar: mulScalar,
            multiply: multiply,
            negate: negate,
            normalize: normalize,
            setDefaultType: setDefaultType,
            subtract: subtract
        };
    });
    define("twgl/m4", [ "./v3" ], function(v3) {
        var MatType = Float32Array;
        var tempV3a = v3.create();
        var tempV3b = v3.create();
        var tempV3c = v3.create();
        function setDefaultType(ctor) {
            var oldType = MatType;
            MatType = ctor;
            return oldType;
        }
        function negate(m, dst) {
            dst = dst || new MatType(16);
            dst[0] = -m[0];
            dst[1] = -m[1];
            dst[2] = -m[2];
            dst[3] = -m[3];
            dst[4] = -m[4];
            dst[5] = -m[5];
            dst[6] = -m[6];
            dst[7] = -m[7];
            dst[8] = -m[8];
            dst[9] = -m[9];
            dst[10] = -m[10];
            dst[11] = -m[11];
            dst[12] = -m[12];
            dst[13] = -m[13];
            dst[14] = -m[14];
            dst[15] = -m[15];
            return dst;
        }
        function copy(m, dst) {
            dst = dst || new MatType(16);
            dst[0] = m[0];
            dst[1] = m[1];
            dst[2] = m[2];
            dst[3] = m[3];
            dst[4] = m[4];
            dst[5] = m[5];
            dst[6] = m[6];
            dst[7] = m[7];
            dst[8] = m[8];
            dst[9] = m[9];
            dst[10] = m[10];
            dst[11] = m[11];
            dst[12] = m[12];
            dst[13] = m[13];
            dst[14] = m[14];
            dst[15] = m[15];
            return dst;
        }
        function identity(dst) {
            dst = dst || new MatType(16);
            dst[0] = 1;
            dst[1] = 0;
            dst[2] = 0;
            dst[3] = 0;
            dst[4] = 0;
            dst[5] = 1;
            dst[6] = 0;
            dst[7] = 0;
            dst[8] = 0;
            dst[9] = 0;
            dst[10] = 1;
            dst[11] = 0;
            dst[12] = 0;
            dst[13] = 0;
            dst[14] = 0;
            dst[15] = 1;
            return dst;
        }
        function transpose(m, dst) {
            dst = dst || new MatType(16);
            if (dst === m) {
                var t;
                t = m[1];
                m[1] = m[4];
                m[4] = t;
                t = m[2];
                m[2] = m[8];
                m[8] = t;
                t = m[3];
                m[3] = m[12];
                m[12] = t;
                t = m[6];
                m[6] = m[9];
                m[9] = t;
                t = m[7];
                m[7] = m[13];
                m[13] = t;
                t = m[11];
                m[11] = m[14];
                m[14] = t;
                return dst;
            }
            var m00 = m[0 * 4 + 0];
            var m01 = m[0 * 4 + 1];
            var m02 = m[0 * 4 + 2];
            var m03 = m[0 * 4 + 3];
            var m10 = m[1 * 4 + 0];
            var m11 = m[1 * 4 + 1];
            var m12 = m[1 * 4 + 2];
            var m13 = m[1 * 4 + 3];
            var m20 = m[2 * 4 + 0];
            var m21 = m[2 * 4 + 1];
            var m22 = m[2 * 4 + 2];
            var m23 = m[2 * 4 + 3];
            var m30 = m[3 * 4 + 0];
            var m31 = m[3 * 4 + 1];
            var m32 = m[3 * 4 + 2];
            var m33 = m[3 * 4 + 3];
            dst[0] = m00;
            dst[1] = m10;
            dst[2] = m20;
            dst[3] = m30;
            dst[4] = m01;
            dst[5] = m11;
            dst[6] = m21;
            dst[7] = m31;
            dst[8] = m02;
            dst[9] = m12;
            dst[10] = m22;
            dst[11] = m32;
            dst[12] = m03;
            dst[13] = m13;
            dst[14] = m23;
            dst[15] = m33;
            return dst;
        }
        function inverse(m, dst) {
            dst = dst || new MatType(16);
            var m00 = m[0 * 4 + 0];
            var m01 = m[0 * 4 + 1];
            var m02 = m[0 * 4 + 2];
            var m03 = m[0 * 4 + 3];
            var m10 = m[1 * 4 + 0];
            var m11 = m[1 * 4 + 1];
            var m12 = m[1 * 4 + 2];
            var m13 = m[1 * 4 + 3];
            var m20 = m[2 * 4 + 0];
            var m21 = m[2 * 4 + 1];
            var m22 = m[2 * 4 + 2];
            var m23 = m[2 * 4 + 3];
            var m30 = m[3 * 4 + 0];
            var m31 = m[3 * 4 + 1];
            var m32 = m[3 * 4 + 2];
            var m33 = m[3 * 4 + 3];
            var tmp_0 = m22 * m33;
            var tmp_1 = m32 * m23;
            var tmp_2 = m12 * m33;
            var tmp_3 = m32 * m13;
            var tmp_4 = m12 * m23;
            var tmp_5 = m22 * m13;
            var tmp_6 = m02 * m33;
            var tmp_7 = m32 * m03;
            var tmp_8 = m02 * m23;
            var tmp_9 = m22 * m03;
            var tmp_10 = m02 * m13;
            var tmp_11 = m12 * m03;
            var tmp_12 = m20 * m31;
            var tmp_13 = m30 * m21;
            var tmp_14 = m10 * m31;
            var tmp_15 = m30 * m11;
            var tmp_16 = m10 * m21;
            var tmp_17 = m20 * m11;
            var tmp_18 = m00 * m31;
            var tmp_19 = m30 * m01;
            var tmp_20 = m00 * m21;
            var tmp_21 = m20 * m01;
            var tmp_22 = m00 * m11;
            var tmp_23 = m10 * m01;
            var t0 = tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31 - (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
            var t1 = tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31 - (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
            var t2 = tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31 - (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
            var t3 = tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21 - (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);
            var d = 1 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);
            dst[0] = d * t0;
            dst[1] = d * t1;
            dst[2] = d * t2;
            dst[3] = d * t3;
            dst[4] = d * (tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30 - (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30));
            dst[5] = d * (tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30 - (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30));
            dst[6] = d * (tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30 - (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30));
            dst[7] = d * (tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20 - (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20));
            dst[8] = d * (tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33 - (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33));
            dst[9] = d * (tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33 - (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33));
            dst[10] = d * (tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33 - (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33));
            dst[11] = d * (tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23 - (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23));
            dst[12] = d * (tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12 - (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22));
            dst[13] = d * (tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22 - (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02));
            dst[14] = d * (tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02 - (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12));
            dst[15] = d * (tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12 - (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02));
            return dst;
        }
        function multiply(a, b, dst) {
            dst = dst || new MatType(16);
            var a00 = a[0];
            var a01 = a[1];
            var a02 = a[2];
            var a03 = a[3];
            var a10 = a[4 + 0];
            var a11 = a[4 + 1];
            var a12 = a[4 + 2];
            var a13 = a[4 + 3];
            var a20 = a[8 + 0];
            var a21 = a[8 + 1];
            var a22 = a[8 + 2];
            var a23 = a[8 + 3];
            var a30 = a[12 + 0];
            var a31 = a[12 + 1];
            var a32 = a[12 + 2];
            var a33 = a[12 + 3];
            var b00 = b[0];
            var b01 = b[1];
            var b02 = b[2];
            var b03 = b[3];
            var b10 = b[4 + 0];
            var b11 = b[4 + 1];
            var b12 = b[4 + 2];
            var b13 = b[4 + 3];
            var b20 = b[8 + 0];
            var b21 = b[8 + 1];
            var b22 = b[8 + 2];
            var b23 = b[8 + 3];
            var b30 = b[12 + 0];
            var b31 = b[12 + 1];
            var b32 = b[12 + 2];
            var b33 = b[12 + 3];
            dst[0] = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
            dst[1] = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
            dst[2] = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
            dst[3] = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;
            dst[4] = a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30;
            dst[5] = a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31;
            dst[6] = a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32;
            dst[7] = a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33;
            dst[8] = a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30;
            dst[9] = a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31;
            dst[10] = a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32;
            dst[11] = a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33;
            dst[12] = a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30;
            dst[13] = a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31;
            dst[14] = a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32;
            dst[15] = a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33;
            return dst;
        }
        function setTranslation(a, v, dst) {
            dst = dst || identity();
            if (a !== dst) {
                dst[0] = a[0];
                dst[1] = a[1];
                dst[2] = a[2];
                dst[3] = a[3];
                dst[4] = a[4];
                dst[5] = a[5];
                dst[6] = a[6];
                dst[7] = a[7];
                dst[8] = a[8];
                dst[9] = a[9];
                dst[10] = a[10];
                dst[11] = a[11];
            }
            dst[12] = v[0];
            dst[13] = v[1];
            dst[14] = v[2];
            dst[15] = 1;
            return dst;
        }
        function getTranslation(m, dst) {
            dst = dst || v3.create();
            dst[0] = m[12];
            dst[1] = m[13];
            dst[2] = m[14];
            return dst;
        }
        function getAxis(m, axis, dst) {
            dst = dst || v3.create();
            var off = axis * 4;
            dst[0] = m[off + 0];
            dst[1] = m[off + 1];
            dst[2] = m[off + 2];
            return dst;
        }
        function setAxis(a, v, axis, dst) {
            if (dst !== a) {
                dst = copy(a, dst);
            }
            var off = axis * 4;
            dst[off + 0] = v[0];
            dst[off + 1] = v[1];
            dst[off + 2] = v[2];
            return dst;
        }
        function perspective(fieldOfViewYInRadians, aspect, zNear, zFar, dst) {
            dst = dst || new MatType(16);
            var f = Math.tan(Math.PI * .5 - .5 * fieldOfViewYInRadians);
            var rangeInv = 1 / (zNear - zFar);
            dst[0] = f / aspect;
            dst[1] = 0;
            dst[2] = 0;
            dst[3] = 0;
            dst[4] = 0;
            dst[5] = f;
            dst[6] = 0;
            dst[7] = 0;
            dst[8] = 0;
            dst[9] = 0;
            dst[10] = (zNear + zFar) * rangeInv;
            dst[11] = -1;
            dst[12] = 0;
            dst[13] = 0;
            dst[14] = zNear * zFar * rangeInv * 2;
            dst[15] = 0;
            return dst;
        }
        function ortho(left, right, bottom, top, near, far, dst) {
            dst = dst || new MatType(16);
            dst[0] = 2 / (right - left);
            dst[1] = 0;
            dst[2] = 0;
            dst[3] = 0;
            dst[4] = 0;
            dst[5] = 2 / (top - bottom);
            dst[6] = 0;
            dst[7] = 0;
            dst[8] = 0;
            dst[9] = 0;
            dst[10] = -1 / (far - near);
            dst[11] = 0;
            dst[12] = (right + left) / (left - right);
            dst[13] = (top + bottom) / (bottom - top);
            dst[14] = -near / (near - far);
            dst[15] = 1;
            return dst;
        }
        function frustum(left, right, bottom, top, near, far, dst) {
            dst = dst || new MatType(16);
            var dx = right - left;
            var dy = top - bottom;
            var dz = near - far;
            dst[0] = 2 * near / dx;
            dst[1] = 0;
            dst[2] = 0;
            dst[3] = 0;
            dst[4] = 0;
            dst[5] = 2 * near / dy;
            dst[6] = 0;
            dst[7] = 0;
            dst[8] = (left + right) / dx;
            dst[9] = (top + bottom) / dy;
            dst[10] = far / dz;
            dst[11] = -1;
            dst[12] = 0;
            dst[13] = 0;
            dst[14] = near * far / dz;
            dst[15] = 0;
            return dst;
        }
        function lookAt(eye, target, up, dst) {
            dst = dst || new MatType(16);
            var xAxis = tempV3a;
            var yAxis = tempV3b;
            var zAxis = tempV3c;
            v3.normalize(v3.subtract(eye, target, zAxis), zAxis);
            v3.normalize(v3.cross(up, zAxis, xAxis), xAxis);
            v3.normalize(v3.cross(zAxis, xAxis, yAxis), yAxis);
            dst[0] = xAxis[0];
            dst[1] = xAxis[1];
            dst[2] = xAxis[2];
            dst[3] = 0;
            dst[4] = yAxis[0];
            dst[5] = yAxis[1];
            dst[6] = yAxis[2];
            dst[7] = 0;
            dst[8] = zAxis[0];
            dst[9] = zAxis[1];
            dst[10] = zAxis[2];
            dst[11] = 0;
            dst[12] = eye[0];
            dst[13] = eye[1];
            dst[14] = eye[2];
            dst[15] = 1;
            return dst;
        }
        function translation(v, dst) {
            dst = dst || new MatType(16);
            dst[0] = 1;
            dst[1] = 0;
            dst[2] = 0;
            dst[3] = 0;
            dst[4] = 0;
            dst[5] = 1;
            dst[6] = 0;
            dst[7] = 0;
            dst[8] = 0;
            dst[9] = 0;
            dst[10] = 1;
            dst[11] = 0;
            dst[12] = v[0];
            dst[13] = v[1];
            dst[14] = v[2];
            dst[15] = 1;
            return dst;
        }
        function translate(m, v, dst) {
            dst = dst || new MatType(16);
            var v0 = v[0];
            var v1 = v[1];
            var v2 = v[2];
            var m00 = m[0];
            var m01 = m[1];
            var m02 = m[2];
            var m03 = m[3];
            var m10 = m[1 * 4 + 0];
            var m11 = m[1 * 4 + 1];
            var m12 = m[1 * 4 + 2];
            var m13 = m[1 * 4 + 3];
            var m20 = m[2 * 4 + 0];
            var m21 = m[2 * 4 + 1];
            var m22 = m[2 * 4 + 2];
            var m23 = m[2 * 4 + 3];
            var m30 = m[3 * 4 + 0];
            var m31 = m[3 * 4 + 1];
            var m32 = m[3 * 4 + 2];
            var m33 = m[3 * 4 + 3];
            if (m !== dst) {
                dst[0] = m00;
                dst[1] = m01;
                dst[2] = m02;
                dst[3] = m03;
                dst[4] = m10;
                dst[5] = m11;
                dst[6] = m12;
                dst[7] = m13;
                dst[8] = m20;
                dst[9] = m21;
                dst[10] = m22;
                dst[11] = m23;
            }
            dst[12] = m00 * v0 + m10 * v1 + m20 * v2 + m30;
            dst[13] = m01 * v0 + m11 * v1 + m21 * v2 + m31;
            dst[14] = m02 * v0 + m12 * v1 + m22 * v2 + m32;
            dst[15] = m03 * v0 + m13 * v1 + m23 * v2 + m33;
            return dst;
        }
        function rotationX(angleInRadians, dst) {
            dst = dst || new MatType(16);
            var c = Math.cos(angleInRadians);
            var s = Math.sin(angleInRadians);
            dst[0] = 1;
            dst[1] = 0;
            dst[2] = 0;
            dst[3] = 0;
            dst[4] = 0;
            dst[5] = c;
            dst[6] = s;
            dst[7] = 0;
            dst[8] = 0;
            dst[9] = -s;
            dst[10] = c;
            dst[11] = 0;
            dst[12] = 0;
            dst[13] = 0;
            dst[14] = 0;
            dst[15] = 1;
            return dst;
        }
        function rotateX(m, angleInRadians, dst) {
            dst = dst || new MatType(16);
            var m10 = m[4];
            var m11 = m[5];
            var m12 = m[6];
            var m13 = m[7];
            var m20 = m[8];
            var m21 = m[9];
            var m22 = m[10];
            var m23 = m[11];
            var c = Math.cos(angleInRadians);
            var s = Math.sin(angleInRadians);
            dst[4] = c * m10 + s * m20;
            dst[5] = c * m11 + s * m21;
            dst[6] = c * m12 + s * m22;
            dst[7] = c * m13 + s * m23;
            dst[8] = c * m20 - s * m10;
            dst[9] = c * m21 - s * m11;
            dst[10] = c * m22 - s * m12;
            dst[11] = c * m23 - s * m13;
            if (m !== dst) {
                dst[0] = m[0];
                dst[1] = m[1];
                dst[2] = m[2];
                dst[3] = m[3];
                dst[12] = m[12];
                dst[13] = m[13];
                dst[14] = m[14];
                dst[15] = m[15];
            }
            return dst;
        }
        function rotationY(angleInRadians, dst) {
            dst = dst || new MatType(16);
            var c = Math.cos(angleInRadians);
            var s = Math.sin(angleInRadians);
            dst[0] = c;
            dst[1] = 0;
            dst[2] = -s;
            dst[3] = 0;
            dst[4] = 0;
            dst[5] = 1;
            dst[6] = 0;
            dst[7] = 0;
            dst[8] = s;
            dst[9] = 0;
            dst[10] = c;
            dst[11] = 0;
            dst[12] = 0;
            dst[13] = 0;
            dst[14] = 0;
            dst[15] = 1;
            return dst;
        }
        function rotateY(m, angleInRadians, dst) {
            dst = dst || new MatType(16);
            var m00 = m[0 * 4 + 0];
            var m01 = m[0 * 4 + 1];
            var m02 = m[0 * 4 + 2];
            var m03 = m[0 * 4 + 3];
            var m20 = m[2 * 4 + 0];
            var m21 = m[2 * 4 + 1];
            var m22 = m[2 * 4 + 2];
            var m23 = m[2 * 4 + 3];
            var c = Math.cos(angleInRadians);
            var s = Math.sin(angleInRadians);
            dst[0] = c * m00 - s * m20;
            dst[1] = c * m01 - s * m21;
            dst[2] = c * m02 - s * m22;
            dst[3] = c * m03 - s * m23;
            dst[8] = c * m20 + s * m00;
            dst[9] = c * m21 + s * m01;
            dst[10] = c * m22 + s * m02;
            dst[11] = c * m23 + s * m03;
            if (m !== dst) {
                dst[4] = m[4];
                dst[5] = m[5];
                dst[6] = m[6];
                dst[7] = m[7];
                dst[12] = m[12];
                dst[13] = m[13];
                dst[14] = m[14];
                dst[15] = m[15];
            }
            return dst;
        }
        function rotationZ(angleInRadians, dst) {
            dst = dst || new MatType(16);
            var c = Math.cos(angleInRadians);
            var s = Math.sin(angleInRadians);
            dst[0] = c;
            dst[1] = s;
            dst[2] = 0;
            dst[3] = 0;
            dst[4] = -s;
            dst[5] = c;
            dst[6] = 0;
            dst[7] = 0;
            dst[8] = 0;
            dst[9] = 0;
            dst[10] = 1;
            dst[11] = 0;
            dst[12] = 0;
            dst[13] = 0;
            dst[14] = 0;
            dst[15] = 1;
            return dst;
        }
        function rotateZ(m, angleInRadians, dst) {
            dst = dst || new MatType(16);
            var m00 = m[0 * 4 + 0];
            var m01 = m[0 * 4 + 1];
            var m02 = m[0 * 4 + 2];
            var m03 = m[0 * 4 + 3];
            var m10 = m[1 * 4 + 0];
            var m11 = m[1 * 4 + 1];
            var m12 = m[1 * 4 + 2];
            var m13 = m[1 * 4 + 3];
            var c = Math.cos(angleInRadians);
            var s = Math.sin(angleInRadians);
            dst[0] = c * m00 + s * m10;
            dst[1] = c * m01 + s * m11;
            dst[2] = c * m02 + s * m12;
            dst[3] = c * m03 + s * m13;
            dst[4] = c * m10 - s * m00;
            dst[5] = c * m11 - s * m01;
            dst[6] = c * m12 - s * m02;
            dst[7] = c * m13 - s * m03;
            if (m !== dst) {
                dst[8] = m[8];
                dst[9] = m[9];
                dst[10] = m[10];
                dst[11] = m[11];
                dst[12] = m[12];
                dst[13] = m[13];
                dst[14] = m[14];
                dst[15] = m[15];
            }
            return dst;
        }
        function axisRotation(axis, angleInRadians, dst) {
            dst = dst || new MatType(16);
            var x = axis[0];
            var y = axis[1];
            var z = axis[2];
            var n = Math.sqrt(x * x + y * y + z * z);
            x /= n;
            y /= n;
            z /= n;
            var xx = x * x;
            var yy = y * y;
            var zz = z * z;
            var c = Math.cos(angleInRadians);
            var s = Math.sin(angleInRadians);
            var oneMinusCosine = 1 - c;
            dst[0] = xx + (1 - xx) * c;
            dst[1] = x * y * oneMinusCosine + z * s;
            dst[2] = x * z * oneMinusCosine - y * s;
            dst[3] = 0;
            dst[4] = x * y * oneMinusCosine - z * s;
            dst[5] = yy + (1 - yy) * c;
            dst[6] = y * z * oneMinusCosine + x * s;
            dst[7] = 0;
            dst[8] = x * z * oneMinusCosine + y * s;
            dst[9] = y * z * oneMinusCosine - x * s;
            dst[10] = zz + (1 - zz) * c;
            dst[11] = 0;
            dst[12] = 0;
            dst[13] = 0;
            dst[14] = 0;
            dst[15] = 1;
            return dst;
        }
        function axisRotate(m, axis, angleInRadians, dst) {
            dst = dst || new MatType(16);
            var x = axis[0];
            var y = axis[1];
            var z = axis[2];
            var n = Math.sqrt(x * x + y * y + z * z);
            x /= n;
            y /= n;
            z /= n;
            var xx = x * x;
            var yy = y * y;
            var zz = z * z;
            var c = Math.cos(angleInRadians);
            var s = Math.sin(angleInRadians);
            var oneMinusCosine = 1 - c;
            var r00 = xx + (1 - xx) * c;
            var r01 = x * y * oneMinusCosine + z * s;
            var r02 = x * z * oneMinusCosine - y * s;
            var r10 = x * y * oneMinusCosine - z * s;
            var r11 = yy + (1 - yy) * c;
            var r12 = y * z * oneMinusCosine + x * s;
            var r20 = x * z * oneMinusCosine + y * s;
            var r21 = y * z * oneMinusCosine - x * s;
            var r22 = zz + (1 - zz) * c;
            var m00 = m[0];
            var m01 = m[1];
            var m02 = m[2];
            var m03 = m[3];
            var m10 = m[4];
            var m11 = m[5];
            var m12 = m[6];
            var m13 = m[7];
            var m20 = m[8];
            var m21 = m[9];
            var m22 = m[10];
            var m23 = m[11];
            dst[0] = r00 * m00 + r01 * m10 + r02 * m20;
            dst[1] = r00 * m01 + r01 * m11 + r02 * m21;
            dst[2] = r00 * m02 + r01 * m12 + r02 * m22;
            dst[3] = r00 * m03 + r01 * m13 + r02 * m23;
            dst[4] = r10 * m00 + r11 * m10 + r12 * m20;
            dst[5] = r10 * m01 + r11 * m11 + r12 * m21;
            dst[6] = r10 * m02 + r11 * m12 + r12 * m22;
            dst[7] = r10 * m03 + r11 * m13 + r12 * m23;
            dst[8] = r20 * m00 + r21 * m10 + r22 * m20;
            dst[9] = r20 * m01 + r21 * m11 + r22 * m21;
            dst[10] = r20 * m02 + r21 * m12 + r22 * m22;
            dst[11] = r20 * m03 + r21 * m13 + r22 * m23;
            if (m !== dst) {
                dst[12] = m[12];
                dst[13] = m[13];
                dst[14] = m[14];
                dst[15] = m[15];
            }
            return dst;
        }
        function scaling(v, dst) {
            dst = dst || new MatType(16);
            dst[0] = v[0];
            dst[1] = 0;
            dst[2] = 0;
            dst[3] = 0;
            dst[4] = 0;
            dst[5] = v[1];
            dst[6] = 0;
            dst[7] = 0;
            dst[8] = 0;
            dst[9] = 0;
            dst[10] = v[2];
            dst[11] = 0;
            dst[12] = 0;
            dst[13] = 0;
            dst[14] = 0;
            dst[15] = 1;
            return dst;
        }
        function scale(m, v, dst) {
            dst = dst || new MatType(16);
            var v0 = v[0];
            var v1 = v[1];
            var v2 = v[2];
            dst[0] = v0 * m[0 * 4 + 0];
            dst[1] = v0 * m[0 * 4 + 1];
            dst[2] = v0 * m[0 * 4 + 2];
            dst[3] = v0 * m[0 * 4 + 3];
            dst[4] = v1 * m[1 * 4 + 0];
            dst[5] = v1 * m[1 * 4 + 1];
            dst[6] = v1 * m[1 * 4 + 2];
            dst[7] = v1 * m[1 * 4 + 3];
            dst[8] = v2 * m[2 * 4 + 0];
            dst[9] = v2 * m[2 * 4 + 1];
            dst[10] = v2 * m[2 * 4 + 2];
            dst[11] = v2 * m[2 * 4 + 3];
            if (m !== dst) {
                dst[12] = m[12];
                dst[13] = m[13];
                dst[14] = m[14];
                dst[15] = m[15];
            }
            return dst;
        }
        function transformPoint(m, v, dst) {
            dst = dst || v3.create();
            var v0 = v[0];
            var v1 = v[1];
            var v2 = v[2];
            var d = v0 * m[0 * 4 + 3] + v1 * m[1 * 4 + 3] + v2 * m[2 * 4 + 3] + m[3 * 4 + 3];
            dst[0] = (v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0] + m[3 * 4 + 0]) / d;
            dst[1] = (v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1] + m[3 * 4 + 1]) / d;
            dst[2] = (v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2] + m[3 * 4 + 2]) / d;
            return dst;
        }
        function transformDirection(m, v, dst) {
            dst = dst || v3.create();
            var v0 = v[0];
            var v1 = v[1];
            var v2 = v[2];
            dst[0] = v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0];
            dst[1] = v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1];
            dst[2] = v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2];
            return dst;
        }
        function transformNormal(m, v, dst) {
            dst = dst || v3.create();
            var mi = inverse(m);
            var v0 = v[0];
            var v1 = v[1];
            var v2 = v[2];
            dst[0] = v0 * mi[0 * 4 + 0] + v1 * mi[0 * 4 + 1] + v2 * mi[0 * 4 + 2];
            dst[1] = v0 * mi[1 * 4 + 0] + v1 * mi[1 * 4 + 1] + v2 * mi[1 * 4 + 2];
            dst[2] = v0 * mi[2 * 4 + 0] + v1 * mi[2 * 4 + 1] + v2 * mi[2 * 4 + 2];
            return dst;
        }
        return {
            axisRotate: axisRotate,
            axisRotation: axisRotation,
            create: identity,
            copy: copy,
            frustum: frustum,
            getAxis: getAxis,
            getTranslation: getTranslation,
            identity: identity,
            inverse: inverse,
            lookAt: lookAt,
            multiply: multiply,
            negate: negate,
            ortho: ortho,
            perspective: perspective,
            rotateX: rotateX,
            rotateY: rotateY,
            rotateZ: rotateZ,
            rotateAxis: axisRotate,
            rotationX: rotationX,
            rotationY: rotationY,
            rotationZ: rotationZ,
            scale: scale,
            scaling: scaling,
            setAxis: setAxis,
            setDefaultType: setDefaultType,
            setTranslation: setTranslation,
            transformDirection: transformDirection,
            transformNormal: transformNormal,
            transformPoint: transformPoint,
            translate: translate,
            translation: translation,
            transpose: transpose
        };
    });
    define("twgl/primitives", [ "./attributes", "./twgl", "./utils", "./m4", "./v3" ], function(attributes, twgl, utils, m4, v3) {
        var getArray = attributes.getArray_;
        var getNumComponents = attributes.getNumComponents_;
        function augmentTypedArray(typedArray, numComponents) {
            var cursor = 0;
            typedArray.push = function() {
                for (var ii = 0; ii < arguments.length; ++ii) {
                    var value = arguments[ii];
                    if (value instanceof Array || value.buffer && value.buffer instanceof ArrayBuffer) {
                        for (var jj = 0; jj < value.length; ++jj) {
                            typedArray[cursor++] = value[jj];
                        }
                    } else {
                        typedArray[cursor++] = value;
                    }
                }
            };
            typedArray.reset = function(opt_index) {
                cursor = opt_index || 0;
            };
            typedArray.numComponents = numComponents;
            Object.defineProperty(typedArray, "numElements", {
                get: function() {
                    return this.length / this.numComponents | 0;
                }
            });
            return typedArray;
        }
        function createAugmentedTypedArray(numComponents, numElements, opt_type) {
            var Type = opt_type || Float32Array;
            return augmentTypedArray(new Type(numComponents * numElements), numComponents);
        }
        function allButIndices(name) {
            return name !== "indices";
        }
        function deindexVertices(vertices) {
            var indices = vertices.indices;
            var newVertices = {};
            var numElements = indices.length;
            function expandToUnindexed(channel) {
                var srcBuffer = vertices[channel];
                var numComponents = srcBuffer.numComponents;
                var dstBuffer = createAugmentedTypedArray(numComponents, numElements, srcBuffer.constructor);
                for (var ii = 0; ii < numElements; ++ii) {
                    var ndx = indices[ii];
                    var offset = ndx * numComponents;
                    for (var jj = 0; jj < numComponents; ++jj) {
                        dstBuffer.push(srcBuffer[offset + jj]);
                    }
                }
                newVertices[channel] = dstBuffer;
            }
            Object.keys(vertices).filter(allButIndices).forEach(expandToUnindexed);
            return newVertices;
        }
        function flattenNormals(vertices) {
            if (vertices.indices) {
                throw "can't flatten normals of indexed vertices. deindex them first";
            }
            var normals = vertices.normal;
            var numNormals = normals.length;
            for (var ii = 0; ii < numNormals; ii += 9) {
                var nax = normals[ii + 0];
                var nay = normals[ii + 1];
                var naz = normals[ii + 2];
                var nbx = normals[ii + 3];
                var nby = normals[ii + 4];
                var nbz = normals[ii + 5];
                var ncx = normals[ii + 6];
                var ncy = normals[ii + 7];
                var ncz = normals[ii + 8];
                var nx = nax + nbx + ncx;
                var ny = nay + nby + ncy;
                var nz = naz + nbz + ncz;
                var length = Math.sqrt(nx * nx + ny * ny + nz * nz);
                nx /= length;
                ny /= length;
                nz /= length;
                normals[ii + 0] = nx;
                normals[ii + 1] = ny;
                normals[ii + 2] = nz;
                normals[ii + 3] = nx;
                normals[ii + 4] = ny;
                normals[ii + 5] = nz;
                normals[ii + 6] = nx;
                normals[ii + 7] = ny;
                normals[ii + 8] = nz;
            }
            return vertices;
        }
        function applyFuncToV3Array(array, matrix, fn) {
            var len = array.length;
            var tmp = new Float32Array(3);
            for (var ii = 0; ii < len; ii += 3) {
                fn(matrix, [ array[ii], array[ii + 1], array[ii + 2] ], tmp);
                array[ii] = tmp[0];
                array[ii + 1] = tmp[1];
                array[ii + 2] = tmp[2];
            }
        }
        function transformNormal(mi, v, dst) {
            dst = dst || v3.create();
            var v0 = v[0];
            var v1 = v[1];
            var v2 = v[2];
            dst[0] = v0 * mi[0 * 4 + 0] + v1 * mi[0 * 4 + 1] + v2 * mi[0 * 4 + 2];
            dst[1] = v0 * mi[1 * 4 + 0] + v1 * mi[1 * 4 + 1] + v2 * mi[1 * 4 + 2];
            dst[2] = v0 * mi[2 * 4 + 0] + v1 * mi[2 * 4 + 1] + v2 * mi[2 * 4 + 2];
            return dst;
        }
        function reorientDirections(array, matrix) {
            applyFuncToV3Array(array, matrix, m4.transformDirection);
            return array;
        }
        function reorientNormals(array, matrix) {
            applyFuncToV3Array(array, m4.inverse(matrix), transformNormal);
            return array;
        }
        function reorientPositions(array, matrix) {
            applyFuncToV3Array(array, matrix, m4.transformPoint);
            return array;
        }
        function reorientVertices(arrays, matrix) {
            Object.keys(arrays).forEach(function(name) {
                var array = arrays[name];
                if (name.indexOf("pos") >= 0) {
                    reorientPositions(array, matrix);
                } else if (name.indexOf("tan") >= 0 || name.indexOf("binorm") >= 0) {
                    reorientDirections(array, matrix);
                } else if (name.indexOf("norm") >= 0) {
                    reorientNormals(array, matrix);
                }
            });
            return arrays;
        }
        function createXYQuadVertices(size, xOffset, yOffset) {
            size = size || 2;
            xOffset = xOffset || 0;
            yOffset = yOffset || 0;
            size *= .5;
            return {
                position: {
                    numComponents: 2,
                    data: [ xOffset + -1 * size, yOffset + -1 * size, xOffset + 1 * size, yOffset + -1 * size, xOffset + -1 * size, yOffset + 1 * size, xOffset + 1 * size, yOffset + 1 * size ]
                },
                normal: [ 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1 ],
                texcoord: [ 0, 0, 1, 0, 0, 1, 1, 1 ],
                indices: [ 0, 1, 2, 2, 1, 3 ]
            };
        }
        function createPlaneVertices(width, depth, subdivisionsWidth, subdivisionsDepth, matrix) {
            width = width || 1;
            depth = depth || 1;
            subdivisionsWidth = subdivisionsWidth || 1;
            subdivisionsDepth = subdivisionsDepth || 1;
            matrix = matrix || m4.identity();
            var numVertices = (subdivisionsWidth + 1) * (subdivisionsDepth + 1);
            var positions = createAugmentedTypedArray(3, numVertices);
            var normals = createAugmentedTypedArray(3, numVertices);
            var texcoords = createAugmentedTypedArray(2, numVertices);
            for (var z = 0; z <= subdivisionsDepth; z++) {
                for (var x = 0; x <= subdivisionsWidth; x++) {
                    var u = x / subdivisionsWidth;
                    var v = z / subdivisionsDepth;
                    positions.push(width * u - width * .5, 0, depth * v - depth * .5);
                    normals.push(0, 1, 0);
                    texcoords.push(u, v);
                }
            }
            var numVertsAcross = subdivisionsWidth + 1;
            var indices = createAugmentedTypedArray(3, subdivisionsWidth * subdivisionsDepth * 2, Uint16Array);
            for (var z = 0; z < subdivisionsDepth; z++) {
                for (var x = 0; x < subdivisionsWidth; x++) {
                    indices.push((z + 0) * numVertsAcross + x, (z + 1) * numVertsAcross + x, (z + 0) * numVertsAcross + x + 1);
                    indices.push((z + 1) * numVertsAcross + x, (z + 1) * numVertsAcross + x + 1, (z + 0) * numVertsAcross + x + 1);
                }
            }
            var arrays = reorientVertices({
                position: positions,
                normal: normals,
                texcoord: texcoords,
                indices: indices
            }, matrix);
            return arrays;
        }
        function createSphereVertices(radius, subdivisionsAxis, subdivisionsHeight, opt_startLatitudeInRadians, opt_endLatitudeInRadians, opt_startLongitudeInRadians, opt_endLongitudeInRadians) {
            if (subdivisionsAxis <= 0 || subdivisionsHeight <= 0) {
                throw Error("subdivisionAxis and subdivisionHeight must be > 0");
            }
            opt_startLatitudeInRadians = opt_startLatitudeInRadians || 0;
            opt_endLatitudeInRadians = opt_endLatitudeInRadians || Math.PI;
            opt_startLongitudeInRadians = opt_startLongitudeInRadians || 0;
            opt_endLongitudeInRadians = opt_endLongitudeInRadians || Math.PI * 2;
            var latRange = opt_endLatitudeInRadians - opt_startLatitudeInRadians;
            var longRange = opt_endLongitudeInRadians - opt_startLongitudeInRadians;
            var numVertices = (subdivisionsAxis + 1) * (subdivisionsHeight + 1);
            var positions = createAugmentedTypedArray(3, numVertices);
            var normals = createAugmentedTypedArray(3, numVertices);
            var texcoords = createAugmentedTypedArray(2, numVertices);
            for (var y = 0; y <= subdivisionsHeight; y++) {
                for (var x = 0; x <= subdivisionsAxis; x++) {
                    var u = x / subdivisionsAxis;
                    var v = y / subdivisionsHeight;
                    var theta = longRange * u;
                    var phi = latRange * v;
                    var sinTheta = Math.sin(theta);
                    var cosTheta = Math.cos(theta);
                    var sinPhi = Math.sin(phi);
                    var cosPhi = Math.cos(phi);
                    var ux = cosTheta * sinPhi;
                    var uy = cosPhi;
                    var uz = sinTheta * sinPhi;
                    positions.push(radius * ux, radius * uy, radius * uz);
                    normals.push(ux, uy, uz);
                    texcoords.push(1 - u, v);
                }
            }
            var numVertsAround = subdivisionsAxis + 1;
            var indices = createAugmentedTypedArray(3, subdivisionsAxis * subdivisionsHeight * 2, Uint16Array);
            for (var x = 0; x < subdivisionsAxis; x++) {
                for (var y = 0; y < subdivisionsHeight; y++) {
                    indices.push((y + 0) * numVertsAround + x, (y + 0) * numVertsAround + x + 1, (y + 1) * numVertsAround + x);
                    indices.push((y + 1) * numVertsAround + x, (y + 0) * numVertsAround + x + 1, (y + 1) * numVertsAround + x + 1);
                }
            }
            return {
                position: positions,
                normal: normals,
                texcoord: texcoords,
                indices: indices
            };
        }
        var CUBE_FACE_INDICES = [ [ 3, 7, 5, 1 ], [ 6, 2, 0, 4 ], [ 6, 7, 3, 2 ], [ 0, 1, 5, 4 ], [ 7, 6, 4, 5 ], [ 2, 3, 1, 0 ] ];
        function createCubeVertices(size) {
            size = size || 1;
            var k = size / 2;
            var cornerVertices = [ [ -k, -k, -k ], [ +k, -k, -k ], [ -k, +k, -k ], [ +k, +k, -k ], [ -k, -k, +k ], [ +k, -k, +k ], [ -k, +k, +k ], [ +k, +k, +k ] ];
            var faceNormals = [ [ +1, +0, +0 ], [ -1, +0, +0 ], [ +0, +1, +0 ], [ +0, -1, +0 ], [ +0, +0, +1 ], [ +0, +0, -1 ] ];
            var uvCoords = [ [ 1, 0 ], [ 0, 0 ], [ 0, 1 ], [ 1, 1 ] ];
            var numVertices = 6 * 4;
            var positions = createAugmentedTypedArray(3, numVertices);
            var normals = createAugmentedTypedArray(3, numVertices);
            var texcoords = createAugmentedTypedArray(2, numVertices);
            var indices = createAugmentedTypedArray(3, 6 * 2, Uint16Array);
            for (var f = 0; f < 6; ++f) {
                var faceIndices = CUBE_FACE_INDICES[f];
                for (var v = 0; v < 4; ++v) {
                    var position = cornerVertices[faceIndices[v]];
                    var normal = faceNormals[f];
                    var uv = uvCoords[v];
                    positions.push(position);
                    normals.push(normal);
                    texcoords.push(uv);
                }
                var offset = 4 * f;
                indices.push(offset + 0, offset + 1, offset + 2);
                indices.push(offset + 0, offset + 2, offset + 3);
            }
            return {
                position: positions,
                normal: normals,
                texcoord: texcoords,
                indices: indices
            };
        }
        function createTruncatedConeVertices(bottomRadius, topRadius, height, radialSubdivisions, verticalSubdivisions, opt_topCap, opt_bottomCap) {
            if (radialSubdivisions < 3) {
                throw Error("radialSubdivisions must be 3 or greater");
            }
            if (verticalSubdivisions < 1) {
                throw Error("verticalSubdivisions must be 1 or greater");
            }
            var topCap = opt_topCap === undefined ? true : opt_topCap;
            var bottomCap = opt_bottomCap === undefined ? true : opt_bottomCap;
            var extra = (topCap ? 2 : 0) + (bottomCap ? 2 : 0);
            var numVertices = (radialSubdivisions + 1) * (verticalSubdivisions + 1 + extra);
            var positions = createAugmentedTypedArray(3, numVertices);
            var normals = createAugmentedTypedArray(3, numVertices);
            var texcoords = createAugmentedTypedArray(2, numVertices);
            var indices = createAugmentedTypedArray(3, radialSubdivisions * (verticalSubdivisions + extra) * 2, Uint16Array);
            var vertsAroundEdge = radialSubdivisions + 1;
            var slant = Math.atan2(bottomRadius - topRadius, height);
            var cosSlant = Math.cos(slant);
            var sinSlant = Math.sin(slant);
            var start = topCap ? -2 : 0;
            var end = verticalSubdivisions + (bottomCap ? 2 : 0);
            for (var yy = start; yy <= end; ++yy) {
                var v = yy / verticalSubdivisions;
                var y = height * v;
                var ringRadius;
                if (yy < 0) {
                    y = 0;
                    v = 1;
                    ringRadius = bottomRadius;
                } else if (yy > verticalSubdivisions) {
                    y = height;
                    v = 1;
                    ringRadius = topRadius;
                } else {
                    ringRadius = bottomRadius + (topRadius - bottomRadius) * (yy / verticalSubdivisions);
                }
                if (yy === -2 || yy === verticalSubdivisions + 2) {
                    ringRadius = 0;
                    v = 0;
                }
                y -= height / 2;
                for (var ii = 0; ii < vertsAroundEdge; ++ii) {
                    var sin = Math.sin(ii * Math.PI * 2 / radialSubdivisions);
                    var cos = Math.cos(ii * Math.PI * 2 / radialSubdivisions);
                    positions.push(sin * ringRadius, y, cos * ringRadius);
                    normals.push(yy < 0 || yy > verticalSubdivisions ? 0 : sin * cosSlant, yy < 0 ? -1 : yy > verticalSubdivisions ? 1 : sinSlant, yy < 0 || yy > verticalSubdivisions ? 0 : cos * cosSlant);
                    texcoords.push(ii / radialSubdivisions, 1 - v);
                }
            }
            for (var yy = 0; yy < verticalSubdivisions + extra; ++yy) {
                for (var ii = 0; ii < radialSubdivisions; ++ii) {
                    indices.push(vertsAroundEdge * (yy + 0) + 0 + ii, vertsAroundEdge * (yy + 0) + 1 + ii, vertsAroundEdge * (yy + 1) + 1 + ii);
                    indices.push(vertsAroundEdge * (yy + 0) + 0 + ii, vertsAroundEdge * (yy + 1) + 1 + ii, vertsAroundEdge * (yy + 1) + 0 + ii);
                }
            }
            return {
                position: positions,
                normal: normals,
                texcoord: texcoords,
                indices: indices
            };
        }
        function expandRLEData(rleData, padding) {
            padding = padding || [];
            var data = [];
            for (var ii = 0; ii < rleData.length; ii += 4) {
                var runLength = rleData[ii];
                var element = rleData.slice(ii + 1, ii + 4);
                element.push.apply(element, padding);
                for (var jj = 0; jj < runLength; ++jj) {
                    data.push.apply(data, element);
                }
            }
            return data;
        }
        function create3DFVertices() {
            var positions = [ 0, 0, 0, 0, 150, 0, 30, 0, 0, 0, 150, 0, 30, 150, 0, 30, 0, 0, 30, 0, 0, 30, 30, 0, 100, 0, 0, 30, 30, 0, 100, 30, 0, 100, 0, 0, 30, 60, 0, 30, 90, 0, 67, 60, 0, 30, 90, 0, 67, 90, 0, 67, 60, 0, 0, 0, 30, 30, 0, 30, 0, 150, 30, 0, 150, 30, 30, 0, 30, 30, 150, 30, 30, 0, 30, 100, 0, 30, 30, 30, 30, 30, 30, 30, 100, 0, 30, 100, 30, 30, 30, 60, 30, 67, 60, 30, 30, 90, 30, 30, 90, 30, 67, 60, 30, 67, 90, 30, 0, 0, 0, 100, 0, 0, 100, 0, 30, 0, 0, 0, 100, 0, 30, 0, 0, 30, 100, 0, 0, 100, 30, 0, 100, 30, 30, 100, 0, 0, 100, 30, 30, 100, 0, 30, 30, 30, 0, 30, 30, 30, 100, 30, 30, 30, 30, 0, 100, 30, 30, 100, 30, 0, 30, 30, 0, 30, 60, 30, 30, 30, 30, 30, 30, 0, 30, 60, 0, 30, 60, 30, 30, 60, 0, 67, 60, 30, 30, 60, 30, 30, 60, 0, 67, 60, 0, 67, 60, 30, 67, 60, 0, 67, 90, 30, 67, 60, 30, 67, 60, 0, 67, 90, 0, 67, 90, 30, 30, 90, 0, 30, 90, 30, 67, 90, 30, 30, 90, 0, 67, 90, 30, 67, 90, 0, 30, 90, 0, 30, 150, 30, 30, 90, 30, 30, 90, 0, 30, 150, 0, 30, 150, 30, 0, 150, 0, 0, 150, 30, 30, 150, 30, 0, 150, 0, 30, 150, 30, 30, 150, 0, 0, 0, 0, 0, 0, 30, 0, 150, 30, 0, 0, 0, 0, 150, 30, 0, 150, 0 ];
            var texcoords = [ .22, .19, .22, .79, .34, .19, .22, .79, .34, .79, .34, .19, .34, .19, .34, .31, .62, .19, .34, .31, .62, .31, .62, .19, .34, .43, .34, .55, .49, .43, .34, .55, .49, .55, .49, .43, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0 ];
            var normals = expandRLEData([ 18, 0, 0, 1, 18, 0, 0, -1, 6, 0, 1, 0, 6, 1, 0, 0, 6, 0, -1, 0, 6, 1, 0, 0, 6, 0, 1, 0, 6, 1, 0, 0, 6, 0, -1, 0, 6, 1, 0, 0, 6, 0, -1, 0, 6, -1, 0, 0 ]);
            var colors = expandRLEData([ 18, 200, 70, 120, 18, 80, 70, 200, 6, 70, 200, 210, 6, 200, 200, 70, 6, 210, 100, 70, 6, 210, 160, 70, 6, 70, 180, 210, 6, 100, 70, 210, 6, 76, 210, 100, 6, 140, 210, 80, 6, 90, 130, 110, 6, 160, 160, 220 ], [ 255 ]);
            var numVerts = positions.length / 3;
            var arrays = {
                position: createAugmentedTypedArray(3, numVerts),
                texcoord: createAugmentedTypedArray(2, numVerts),
                normal: createAugmentedTypedArray(3, numVerts),
                color: createAugmentedTypedArray(4, numVerts, Uint8Array),
                indices: createAugmentedTypedArray(3, numVerts / 3, Uint16Array)
            };
            arrays.position.push(positions);
            arrays.texcoord.push(texcoords);
            arrays.normal.push(normals);
            arrays.color.push(colors);
            for (var ii = 0; ii < numVerts; ++ii) {
                arrays.indices.push(ii);
            }
            return arrays;
        }
        function createCresentVertices(verticalRadius, outerRadius, innerRadius, thickness, subdivisionsDown, startOffset, endOffset) {
            if (subdivisionsDown <= 0) {
                throw Error("subdivisionDown must be > 0");
            }
            startOffset = startOffset || 0;
            endOffset = endOffset || 1;
            var subdivisionsThick = 2;
            var offsetRange = endOffset - startOffset;
            var numVertices = (subdivisionsDown + 1) * 2 * (2 + subdivisionsThick);
            var positions = createAugmentedTypedArray(3, numVertices);
            var normals = createAugmentedTypedArray(3, numVertices);
            var texcoords = createAugmentedTypedArray(2, numVertices);
            function lerp(a, b, s) {
                return a + (b - a) * s;
            }
            function createArc(arcRadius, x, normalMult, normalAdd, uMult, uAdd) {
                for (var z = 0; z <= subdivisionsDown; z++) {
                    var uBack = x / (subdivisionsThick - 1);
                    var v = z / subdivisionsDown;
                    var xBack = (uBack - .5) * 2;
                    var angle = (startOffset + v * offsetRange) * Math.PI;
                    var s = Math.sin(angle);
                    var c = Math.cos(angle);
                    var radius = lerp(verticalRadius, arcRadius, s);
                    var px = xBack * thickness;
                    var py = c * verticalRadius;
                    var pz = s * radius;
                    positions.push(px, py, pz);
                    var n = v3.add(v3.multiply([ 0, s, c ], normalMult), normalAdd);
                    normals.push(n);
                    texcoords.push(uBack * uMult + uAdd, v);
                }
            }
            for (var x = 0; x < subdivisionsThick; x++) {
                var uBack = (x / (subdivisionsThick - 1) - .5) * 2;
                createArc(outerRadius, x, [ 1, 1, 1 ], [ 0, 0, 0 ], 1, 0);
                createArc(outerRadius, x, [ 0, 0, 0 ], [ uBack, 0, 0 ], 0, 0);
                createArc(innerRadius, x, [ 1, 1, 1 ], [ 0, 0, 0 ], 1, 0);
                createArc(innerRadius, x, [ 0, 0, 0 ], [ uBack, 0, 0 ], 0, 1);
            }
            var indices = createAugmentedTypedArray(3, subdivisionsDown * 2 * (2 + subdivisionsThick), Uint16Array);
            function createSurface(leftArcOffset, rightArcOffset) {
                for (var z = 0; z < subdivisionsDown; ++z) {
                    indices.push(leftArcOffset + z + 0, leftArcOffset + z + 1, rightArcOffset + z + 0);
                    indices.push(leftArcOffset + z + 1, rightArcOffset + z + 1, rightArcOffset + z + 0);
                }
            }
            var numVerticesDown = subdivisionsDown + 1;
            createSurface(numVerticesDown * 0, numVerticesDown * 4);
            createSurface(numVerticesDown * 5, numVerticesDown * 7);
            createSurface(numVerticesDown * 6, numVerticesDown * 2);
            createSurface(numVerticesDown * 3, numVerticesDown * 1);
            return {
                position: positions,
                normal: normals,
                texcoord: texcoords,
                indices: indices
            };
        }
        function createCylinderVertices(radius, height, radialSubdivisions, verticalSubdivisions, topCap, bottomCap) {
            return createTruncatedConeVertices(radius, radius, height, radialSubdivisions, verticalSubdivisions, topCap, bottomCap);
        }
        function createTorusVertices(radius, thickness, radialSubdivisions, bodySubdivisions, startAngle, endAngle) {
            if (radialSubdivisions < 3) {
                throw Error("radialSubdivisions must be 3 or greater");
            }
            if (bodySubdivisions < 3) {
                throw Error("verticalSubdivisions must be 3 or greater");
            }
            startAngle = startAngle || 0;
            endAngle = endAngle || Math.PI * 2;
            range = endAngle - startAngle;
            var radialParts = radialSubdivisions + 1;
            var bodyParts = bodySubdivisions + 1;
            var numVertices = radialParts * bodyParts;
            var positions = createAugmentedTypedArray(3, numVertices);
            var normals = createAugmentedTypedArray(3, numVertices);
            var texcoords = createAugmentedTypedArray(2, numVertices);
            var indices = createAugmentedTypedArray(3, radialSubdivisions * bodySubdivisions * 2, Uint16Array);
            for (var slice = 0; slice < bodyParts; ++slice) {
                var v = slice / bodySubdivisions;
                var sliceAngle = v * Math.PI * 2;
                var sliceSin = Math.sin(sliceAngle);
                var ringRadius = radius + sliceSin * thickness;
                var ny = Math.cos(sliceAngle);
                var y = ny * thickness;
                for (var ring = 0; ring < radialParts; ++ring) {
                    var u = ring / radialSubdivisions;
                    var ringAngle = startAngle + u * range;
                    var xSin = Math.sin(ringAngle);
                    var zCos = Math.cos(ringAngle);
                    var x = xSin * ringRadius;
                    var z = zCos * ringRadius;
                    var nx = xSin * sliceSin;
                    var nz = zCos * sliceSin;
                    positions.push(x, y, z);
                    normals.push(nx, ny, nz);
                    texcoords.push(u, 1 - v);
                }
            }
            for (var slice = 0; slice < bodySubdivisions; ++slice) {
                for (var ring = 0; ring < radialSubdivisions; ++ring) {
                    var nextRingIndex = 1 + ring;
                    var nextSliceIndex = 1 + slice;
                    indices.push(radialParts * slice + ring, radialParts * nextSliceIndex + ring, radialParts * slice + nextRingIndex);
                    indices.push(radialParts * nextSliceIndex + ring, radialParts * nextSliceIndex + nextRingIndex, radialParts * slice + nextRingIndex);
                }
            }
            return {
                position: positions,
                normal: normals,
                texcoord: texcoords,
                indices: indices
            };
        }
        function createDiscVertices(radius, divisions, stacks, innerRadius, stackPower) {
            if (divisions < 3) {
                throw Error("divisions must be at least 3");
            }
            stacks = stacks ? stacks : 1;
            stackPower = stackPower ? stackPower : 1;
            innerRadius = innerRadius ? innerRadius : 0;
            var numVertices = (divisions + 1) * (stacks + 1);
            var positions = createAugmentedTypedArray(3, numVertices);
            var normals = createAugmentedTypedArray(3, numVertices);
            var texcoords = createAugmentedTypedArray(2, numVertices);
            var indices = createAugmentedTypedArray(3, stacks * divisions * 2, Uint16Array);
            var firstIndex = 0;
            var radiusSpan = radius - innerRadius;
            var pointsPerStack = divisions + 1;
            for (var stack = 0; stack <= stacks; ++stack) {
                var stackRadius = innerRadius + radiusSpan * Math.pow(stack / stacks, stackPower);
                for (var i = 0; i <= divisions; ++i) {
                    var theta = 2 * Math.PI * i / divisions;
                    var x = stackRadius * Math.cos(theta);
                    var z = stackRadius * Math.sin(theta);
                    positions.push(x, 0, z);
                    normals.push(0, 1, 0);
                    texcoords.push(1 - i / divisions, stack / stacks);
                    if (stack > 0 && i !== divisions) {
                        var a = firstIndex + (i + 1);
                        var b = firstIndex + i;
                        var c = firstIndex + i - pointsPerStack;
                        var d = firstIndex + (i + 1) - pointsPerStack;
                        indices.push(a, b, c);
                        indices.push(a, c, d);
                    }
                }
                firstIndex += divisions + 1;
            }
            return {
                position: positions,
                normal: normals,
                texcoord: texcoords,
                indices: indices
            };
        }
        function randInt(range) {
            return Math.random() * range | 0;
        }
        function makeRandomVertexColors(vertices, options) {
            options = options || {};
            var numElements = vertices.position.numElements;
            var vcolors = createAugmentedTypedArray(4, numElements, Uint8Array);
            var rand = options.rand || function(ndx, channel) {
                return channel < 3 ? randInt(256) : 255;
            };
            vertices.color = vcolors;
            if (vertices.indices) {
                for (var ii = 0; ii < numElements; ++ii) {
                    vcolors.push(rand(ii, 0), rand(ii, 1), rand(ii, 2), rand(ii, 3));
                }
            } else {
                var numVertsPerColor = options.vertsPerColor || 3;
                var numSets = numElements / numVertsPerColor;
                for (var ii = 0; ii < numSets; ++ii) {
                    var color = [ rand(ii, 0), rand(ii, 1), rand(ii, 2), rand(ii, 3) ];
                    for (var jj = 0; jj < numVertsPerColor; ++jj) {
                        vcolors.push(color);
                    }
                }
            }
            return vertices;
        }
        function createBufferFunc(fn) {
            return function(gl) {
                var arrays = fn.apply(this, Array.prototype.slice.call(arguments, 1));
                return twgl.createBuffersFromArrays(gl, arrays);
            };
        }
        function createBufferInfoFunc(fn) {
            return function(gl) {
                var arrays = fn.apply(null, Array.prototype.slice.call(arguments, 1));
                return twgl.createBufferInfoFromArrays(gl, arrays);
            };
        }
        var arraySpecPropertyNames = [ "numComponents", "size", "type", "normalize", "stride", "offset", "attrib", "name", "attribName" ];
        function copyElements(src, dst, dstNdx, offset) {
            offset = offset || 0;
            var length = src.length;
            for (var ii = 0; ii < length; ++ii) {
                dst[dstNdx + ii] = src[ii] + offset;
            }
        }
        function createArrayOfSameType(srcArray, length) {
            var arraySrc = getArray(srcArray);
            var newArray = new arraySrc.constructor(length);
            var newArraySpec = newArray;
            if (arraySrc.numComponents && arraySrc.numElements) {
                augmentTypedArray(newArray, arraySrc.numComponents);
            }
            if (srcArray.data) {
                newArraySpec = {
                    data: newArray
                };
                utils.copyNamedProperties(arraySpecPropertyNames, srcArray, newArraySpec);
            }
            return newArraySpec;
        }
        function concatVertices(arrayOfArrays) {
            var names = {};
            var baseName;
            for (var ii = 0; ii < arrayOfArrays.length; ++ii) {
                var arrays = arrayOfArrays[ii];
                Object.keys(arrays).forEach(function(name) {
                    if (!names[name]) {
                        names[name] = [];
                    }
                    if (!baseName && name !== "indices") {
                        baseName = name;
                    }
                    var arrayInfo = arrays[name];
                    var numComponents = getNumComponents(arrayInfo, name);
                    var array = getArray(arrayInfo);
                    var numElements = array.length / numComponents;
                    names[name].push(numElements);
                });
            }
            function getLengthOfCombinedArrays(name) {
                var length = 0;
                var arraySpec;
                for (var ii = 0; ii < arrayOfArrays.length; ++ii) {
                    var arrays = arrayOfArrays[ii];
                    var arrayInfo = arrays[name];
                    var array = getArray(arrayInfo);
                    length += array.length;
                    if (!arraySpec || arrayInfo.data) {
                        arraySpec = arrayInfo;
                    }
                }
                return {
                    length: length,
                    spec: arraySpec
                };
            }
            function copyArraysToNewArray(name, base, newArray) {
                var baseIndex = 0;
                var offset = 0;
                for (var ii = 0; ii < arrayOfArrays.length; ++ii) {
                    var arrays = arrayOfArrays[ii];
                    var arrayInfo = arrays[name];
                    var array = getArray(arrayInfo);
                    if (name === "indices") {
                        copyElements(array, newArray, offset, baseIndex);
                        baseIndex += base[ii];
                    } else {
                        copyElements(array, newArray, offset);
                    }
                    offset += array.length;
                }
            }
            var base = names[baseName];
            var newArrays = {};
            Object.keys(names).forEach(function(name) {
                var info = getLengthOfCombinedArrays(name);
                var newArraySpec = createArrayOfSameType(info.spec, info.length);
                copyArraysToNewArray(name, base, getArray(newArraySpec));
                newArrays[name] = newArraySpec;
            });
            return newArrays;
        }
        function duplicateVertices(arrays) {
            var newArrays = {};
            Object.keys(arrays).forEach(function(name) {
                var arraySpec = arrays[name];
                var srcArray = getArray(arraySpec);
                var newArraySpec = createArrayOfSameType(arraySpec, srcArray.length);
                copyElements(srcArray, getArray(newArraySpec), 0);
                newArrays[name] = newArraySpec;
            });
            return newArrays;
        }
        return {
            create3DFBufferInfo: createBufferInfoFunc(create3DFVertices),
            create3DFBuffers: createBufferFunc(create3DFVertices),
            create3DFVertices: create3DFVertices,
            createAugmentedTypedArray: createAugmentedTypedArray,
            createCubeBufferInfo: createBufferInfoFunc(createCubeVertices),
            createCubeBuffers: createBufferFunc(createCubeVertices),
            createCubeVertices: createCubeVertices,
            createPlaneBufferInfo: createBufferInfoFunc(createPlaneVertices),
            createPlaneBuffers: createBufferFunc(createPlaneVertices),
            createPlaneVertices: createPlaneVertices,
            createSphereBufferInfo: createBufferInfoFunc(createSphereVertices),
            createSphereBuffers: createBufferFunc(createSphereVertices),
            createSphereVertices: createSphereVertices,
            createTruncatedConeBufferInfo: createBufferInfoFunc(createTruncatedConeVertices),
            createTruncatedConeBuffers: createBufferFunc(createTruncatedConeVertices),
            createTruncatedConeVertices: createTruncatedConeVertices,
            createXYQuadBufferInfo: createBufferInfoFunc(createXYQuadVertices),
            createXYQuadBuffers: createBufferFunc(createXYQuadVertices),
            createXYQuadVertices: createXYQuadVertices,
            createCresentBufferInfo: createBufferInfoFunc(createCresentVertices),
            createCresentBuffers: createBufferFunc(createCresentVertices),
            createCresentVertices: createCresentVertices,
            createCylinderBufferInfo: createBufferInfoFunc(createCylinderVertices),
            createCylinderBuffers: createBufferFunc(createCylinderVertices),
            createCylinderVertices: createCylinderVertices,
            createTorusBufferInfo: createBufferInfoFunc(createTorusVertices),
            createTorusBuffers: createBufferFunc(createTorusVertices),
            createTorusVertices: createTorusVertices,
            createDiscBufferInfo: createBufferInfoFunc(createDiscVertices),
            createDiscBuffers: createBufferFunc(createDiscVertices),
            createDiscVertices: createDiscVertices,
            deindexVertices: deindexVertices,
            flattenNormals: flattenNormals,
            makeRandomVertexColors: makeRandomVertexColors,
            reorientDirections: reorientDirections,
            reorientNormals: reorientNormals,
            reorientPositions: reorientPositions,
            reorientVertices: reorientVertices,
            concatVertices: concatVertices,
            duplicateVertices: duplicateVertices
        };
    });
    define("main", [ "twgl/twgl", "twgl/m4", "twgl/v3", "twgl/primitives" ], function(twgl, m4, v3, primitives) {
        twgl.m4 = m4;
        twgl.v3 = v3;
        twgl.primitives = primitives;
        return twgl;
    });
    notrequirebecasebrowserifymessesup([ "main" ], function(main) {
        return main;
    }, undefined, true);
    define("build/js/twgl-includer-full", function() {});
    return notrequirebecasebrowserifymessesup("main");
});

var DAMPENING = .96;

var DELTA = 1 / 60;

var VEL_ZERO = .05;

var SIDE_MARGIN = 50;

var BALL_SIZE = 50;

var BALL_PUSHBACK = 400;

var BALL_MOVE_SMOOTH = .6;

var PLAYER_SPREAD = 1.6;

var PLAYER_ACC = 1100;

var PLAYER_ATTACHED_ACC = 900;

var PLAYER_SIZE = 40;

var PLAYER_FREEZE_DELAY = 100;

var PLAYER_MAX_CHARGE = 600;

var PLAYER_DISCHARGE_RATIO = 6;

var PLAYER_DEFEND_HANDICAP = .5;

var GLITCH_PAD = 10;

var GLITCH_ACC = 1e3;

var GLITCH_MIN_CHARGE = PLAYER_MAX_CHARGE / 4;

var GLITCH_DEFEND_TAX = PLAYER_MAX_CHARGE / 6;

var GLITCH_DEFEND_THRESHOLD = 7;

var GLITCH_DEFEND_SPACING = 800;

var GLITCH_SMOOTH_MOVE = .9;

var GLITCH_DRAW_PARAMS = {
    color: [ 1, 1, 1, 1 ],
    size: PLAYER_SIZE,
    bulb: 1,
    spread: 1.4
};

var GLITCH_LATTICE = {
    layers: 4,
    spread: 60,
    normalParams: {
        color: [ .2, .2, .2, 1 ],
        size: PLAYER_SIZE,
        bulb: .4,
        spread: 1
    },
    splParams: GLITCH_DRAW_PARAMS
};

var EventType = {
    INPUT: 1
};

var PlayerState = {
    SEEK: 1,
    DEFEND: 2,
    ATTACK: 3,
    TELEPORT: 4
};

function Body(size) {
    this.bounds = new Box();
    this.pos = new V();
    this.vel = new V();
    this.acc = new V();
    this.bounds.setDim(size, size);
    this._reBound();
}

Body.prototype.from = function(b) {
    this.pos.from(b.pos);
    this.vel.from(b.vel);
};

Body.prototype.stop = function() {
    this.vel.clear();
    this.acc.clear();
};

Body.prototype.at = function(x, y) {
    this.stop();
    this.pos.set(x, y);
    this._reBound();
};

Body.prototype.smoothMoveTo = function(p, smoothness) {
    this.pos.mux(smoothness, p);
    this._reBound();
};

Body.prototype.update = function() {
    this.vel.fAdd(DELTA, this.acc);
    this.pos.fAdd(DELTA, this.vel);
    this.vel.scale(DAMPENING);
    if (this.vel.length() < VEL_ZERO) {
        this.vel.clear();
    }
    this._reBound();
};

Body.prototype._reBound = function() {
    this.bounds.setCenter(this.pos);
};

function Player(left) {
    this.left = left;
    this.directions = [];
    this.charge = PLAYER_MAX_CHARGE;
    this.body = new Body(PLAYER_SIZE);
    this.score = 0;
    this.frozen = 0;
    this.state = PlayerState.SEEK;
    var color = left ? [ 1, 0, 0, 1 ] : [ 0, 1, 0, 1 ];
    this.drawParams = {
        color: color,
        size: PLAYER_SIZE,
        bulb: 1,
        spread: 1
    };
}

Player.prototype.moveIn = function(dir) {
    this.directions.push(dir);
};

Player.prototype.stopIn = function(dir) {
    var idx = this.directions.indexOf(dir);
    if (idx > -1) {
        this.directions.splice(idx, 1);
    }
};

Player.prototype.discharge = function() {
    var handicap = this.state === PlayerState.DEFEND ? PLAYER_DEFEND_HANDICAP : 1;
    this.charge -= handicap * PLAYER_DISCHARGE_RATIO;
    return this.charge <= 0;
};

Player.prototype.update = function() {
    if (this.frozen > 0) {
        this.frozen -= 1;
        var f = 1 - this.frozen / PLAYER_FREEZE_DELAY;
        this.drawParams.bulb = f;
        this.drawParams.spread = f * PLAYER_SPREAD;
        return;
    }
    if (this.charge < PLAYER_MAX_CHARGE) {
        this.charge += 1;
    }
    this._getAcc();
    this.body.update();
};

Player.prototype.canGlitch = function() {
    return this.state !== PlayerState.SEEK && this.charge > GLITCH_MIN_CHARGE && this.frozen <= 0;
};

Player.prototype.freeze = function() {
    this.frozen = PLAYER_FREEZE_DELAY;
    this.drawParams.bulb = 0;
    this.drawParams.spread = 0;
};

Player.prototype._getAcc = function() {
    this.body.acc.clear();
    for (var i = 0; i < this.directions.length; i++) {
        var dir = this.directions[i];
        this.body.acc.fromDirection(dir);
    }
    this.body.acc.normalize();
    this.body.acc.scale(GLITCH_ACC);
    return this.body.acc;
};

var GameState = {
    FREE: 1,
    GLITCH: 2
};

function World(width, height, goalSize) {
    this.tick = 0;
    this.arena = new Box(0, 0, width, height);
    this.state = GameState.FREE;
    this.glitch = {
        target: null,
        body: new Body(PLAYER_SIZE),
        idx: [ 0, 0 ],
        drawParams: GLITCH_DRAW_PARAMS
    };
    this._latticeV = new V();
    this.goalSize = goalSize;
}

World.prototype.init = function() {
    this._initEntities();
    this._start(true);
};

World.prototype.process = function(events) {
    var self = this;
    events.forEach(function(event) {
        switch (event.type) {
          case EventType.INPUT:
            self.handleInput(event);
            break;

          default:
            throw new Error("unknown event type");
        }
    });
};

World.prototype.step = function() {
    this.tick += 1;
    if (this.state === GameState.FREE) {
        this._updatePlayers();
        this._updateBall();
    } else if (this.state === GameState.GLITCH) {
        this._updateGlitch();
    } else {
        throw new Error("unknown state");
    }
};

World.prototype.handleInput = function(inputEvent) {
    var target = this._getTarget(inputEvent.source);
    switch (inputEvent.action) {
      case InputAction.MOVE_BEGIN:
        target.moveIn(inputEvent.direction);
        if (this.state === GameState.GLITCH && target === this.glitch.target) {
            if (target.state === PlayerState.DEFEND) {
                this._moveLattice(inputEvent.direction);
            }
        }
        break;

      case InputAction.MOVE_END:
        target.stopIn(inputEvent.direction);
        break;

      case InputAction.GLITCH_BEGIN:
        if (this.state === GameState.FREE) {
            if (target.canGlitch()) {
                this._beginGlitch(target);
            }
        }
        break;

      case InputAction.GLITCH_END:
        if (this.state === GameState.GLITCH) {
            if (target === this.glitch.target) {
                this._endGlitch();
            }
        }
        break;

      default:
        throw new Error("unknown action");
    }
};

World.prototype._initEntities = function() {
    this.players = [ new Player(true), new Player(false) ];
    this.starter = this.players[0];
    this.ball = {
        body: new Body(BALL_SIZE),
        attached: false,
        drawParams: {
            color: [ 1, 1, 0, 1 ],
            size: BALL_SIZE,
            bulb: 1,
            spread: 1.3
        }
    };
};

World.prototype._updatePlayers = function() {
    for (var i = 0; i < this.players.length; i++) {
        var player = this.players[i];
        player.update();
        if (!this.arena.within(player.body.pos)) {
            if (this.ball.attached === player) {
                var pushF = 1;
                if (Math.abs(player.body.pos.y - this.arena.h / 2) < this.goalSize) {
                    if (!player.left && player.body.pos.x < 0 || player.left && player.body.pos.x > this.arena.w) {
                        player.score += 1;
                        pushF = 2;
                    }
                }
                this.arena.center(this.ball.body.vel);
                this.ball.body.vel.sub(this.ball.body.pos);
                this.ball.body.vel.normalize();
                this.ball.body.vel.scale(pushF * BALL_PUSHBACK);
                this._endPlay();
            }
            this._doSpawn(player);
        }
    }
};

World.prototype._updateBall = function() {
    if (this.ball.attached) {
        var pos = this.ball.attached.body.pos;
        this.ball.body.smoothMoveTo(pos, BALL_MOVE_SMOOTH);
        var player = this.ball.attached;
        var other = this._getOther(player);
        if (other.body.bounds.intersects(this.ball.body.bounds)) {
            if (other.frozen <= 0) {
                this._doSpawn(player);
                this._newPlay(other);
            }
        }
    } else {
        this.ball.body.update();
        for (var i = 0; i < this.players.length; i++) {
            var player = this.players[i];
            if (player.body.bounds.intersects(this.ball.body.bounds)) {
                this._newPlay(player);
            }
        }
    }
};

World.prototype._beginGlitch = function(target) {
    this.state = GameState.GLITCH;
    this.glitch.target = target;
    this.glitch.body.from(target.body);
    if (target.state === PlayerState.DEFEND) {
        target.charge -= GLITCH_DEFEND_TAX;
        this._initLattice(target);
    }
};

World.prototype._updateGlitch = function() {
    var target = this.glitch.target;
    if (target.discharge()) {
        this._endGlitch();
        return;
    }
    if (target.state === PlayerState.ATTACK) {
        var body = this.glitch.body;
        body.acc.from(target._getAcc());
        body.update();
    }
};

World.prototype._endGlitch = function() {
    if (this.glitch.target.state === PlayerState.ATTACK) {
        this.glitch.target.body.from(this.glitch.body);
        var p = this.glitch.body.pos;
        this.ball.body.at(p.x, p.y);
    } else {
        var idx = this.glitch.idx;
        var p = this._latticePoint(idx[0], idx[1], this.glitch.target.left);
        this.glitch.target.body.at(p.x, p.y);
    }
    this.glitch.target = null;
    this.state = GameState.FREE;
};

World.prototype._initLattice = function(target) {
    var pos = target.body.pos;
    var dX = this.arena.w / 2 - pos.x;
    if (!target.left) {
        dX = Math.abs(dX);
    }
    var minDist = Infinity;
    var idx = this.glitch.idx;
    idx[0] = idx[1] = 0;
    this._eachLattice(target.left, function(i, j, p) {
        p.sub(target.body.pos);
        var len = p.length();
        if (len < minDist) {
            minDist = len;
            idx[0] = i;
            idx[1] = j;
        }
    });
};

World.prototype._moveLattice = function(dir) {
    var idx = this.glitch.idx;
    var n = GLITCH_LATTICE.layers;
    var ent = this.glitch.target;
    if (dir === Direction.RIGHT && ent.left || dir === Direction.LEFT && !ent.left) {
        idx[0] = Math.max(0, idx[0] - 1);
        idx[1] = Math.min(idx[0] === 0 ? 0 : 2, idx[1]);
    } else if (dir === Direction.LEFT && ent.left || dir === Direction.RIGHT && !ent.left) {
        idx[0] = Math.min(n - 1, idx[0] + 1);
        if (idx[0] === 1) {
            idx[1] = 1;
        }
    } else if (dir === Direction.UP) {
        idx[1] = Math.min(idx[0] === 0 ? 0 : 2, idx[1] + 1);
    } else if (dir === Direction.DOWN) {
        idx[1] = Math.max(0, idx[1] - 1);
    } else {
        throw new Error("unknown case");
    }
};

World.prototype._eachLattice = function(left, f) {
    for (var i = 0; i < GLITCH_LATTICE.layers; i++) {
        var k = i === 0 ? 1 : 3;
        for (var j = 0; j < k; j++) {
            var p = this._latticePoint(i, j, left);
            f(i, j, p);
        }
    }
};

World.prototype._latticePoint = function(i, j, left) {
    var pos = this._latticeV;
    var spaceX = this.arena.w / (2 * GLITCH_LATTICE.layers);
    var dir = left ? -1 : 1;
    pos.x = this.arena.w / 2 + dir * i * spaceX;
    pos.y = this.arena.h / 2;
    if (i !== 0) {
        var angle = (j - 1) * GLITCH_LATTICE.spread / 360 * Math.PI;
        pos.y += Math.tan(angle) * i * spaceX;
    }
    return pos;
};

World.prototype._newPlay = function(player) {
    this.ball.body.stop();
    this.ball.attached = player;
    player.state = PlayerState.ATTACK;
    var other = this._getOther(player);
    other.state = PlayerState.DEFEND;
};

World.prototype._endPlay = function() {
    var player = this.ball.attached;
    this.ball.attached = false;
    var other = this._getOther(player);
    other.state = player.state = PlayerState.SEEK;
};

World.prototype._getTarget = function(source) {
    return this.players[source];
};

World.prototype._getOther = function(player) {
    return player === this.players[0] ? this.players[1] : this.players[0];
};

World.prototype._start = function() {
    this._adv = this._adv ^ 1;
    for (var i = 0; i < this.players.length; i++) {
        var player = this.players[i];
        player.body.stop();
        player.state = PlayerState.SEEK;
    }
    this._doStart(this.starter);
    var other = this._getOther(this.starter);
    this._doSpawn(other);
    this.starter = other;
    this.ball.body.at(this.arena.w / 2, this.arena.h / 2);
    this.ball.attached = false;
};

World.prototype._doSpawn = function(ent) {
    ent.freeze();
    var space = this.goalSize + SIDE_MARGIN;
    if (ent.left) {
        ent.body.at(space, this.arena.h / 2);
    } else {
        ent.body.at(this.arena.w - space, this.arena.h / 2);
    }
};

World.prototype._doStart = function(ent) {
    ent.freeze();
    var space = this.goalSize + SIDE_MARGIN;
    if (ent.left) {
        ent.body.at(this.arena.w / 2 - space, this.arena.h / 2);
    } else {
        ent.body.at(this.arena.w / 2 + space, this.arena.h / 2);
    }
};