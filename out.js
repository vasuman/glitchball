function Bitmap(width, height) {
    this.can = document.createElement("canvas");
    this.ctx = this.can.getContext("2d");
    this.resize(width, height);
}

Bitmap.prototype.drawBox = function(b) {
    this.ctx.fillRect(b.x, b.y, b.w, b.h);
};

Bitmap.prototype.drawCircle = function(p, r) {
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
    this.ctx.fill();
};

Bitmap.prototype.drawLine = function(s, e) {
    this.ctx.beginPath();
    this.ctx.moveTo(s.x, s.y);
    this.ctx.lineTo(e.x, e.y);
    this.ctx.stroke();
};

Bitmap.prototype.clear = function() {
    this.ctx.clearRect(0, 0, this.width, this.height);
};

Bitmap.prototype.resize = function(width, height) {
    this.width = this.can.width = width;
    this.height = this.can.height = height;
};

var DAMPENING = .95;

function Body() {
    this.bounds = new Box();
    this.pos = new V();
    this.vel = new V();
    this.acc = new V();
}

Body.prototype.update = function(delT) {
    this.vel.fAdd(delT, this.acc);
    this.pos.fAdd(delT, this.vel);
    this.vel.scale(DAMPENING);
    this.acc.set(0, 0);
    this._reBound();
};

Body.prototype.at = function(x, y) {
    this.pos.set(x, y);
    this._reBound();
};

Body.prototype._reBound = function() {
    this.bounds.setCenter(this.pos);
};

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

V.prototype.add = function(o) {
    this.x += o.x;
    this.y += o.y;
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
        this.y -= 1;
        break;

      case Direction.DOWN:
        this.y += 1;
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

var SHIFT_KEY = 16;

var ENTER_KEY = 13;

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
    GLITCH_START: 2,
    GLITCH_END: 3
};

var InputTarget = {
    ONE: 0,
    TWO: 1
};

function MoveEvent(target, direction) {
    this.type = EventType.INPUT;
    this.action = InputAction.MOVE;
    this.target = target;
    this.direction = direction;
}

function GlitchEvent(target, start) {
    this.type = EventType.INPUT;
    this.action = start ? InputAction.GLITCH_START : InputAction.GLITCH_END;
    this.target = target;
}

var input = function() {
    var oneKeyMap = {
        move: WSAD_KEY_MAP,
        glitch: SHIFT_KEY
    };
    var twoKeyMap = {
        move: ARROW_KEY_MAP,
        glitch: ENTER_KEY
    };
    var targets = [ InputTarget.ONE, InputTarget.TWO ];
    var maps = [ oneKeyMap, twoKeyMap ];
    var pending = [];
    var events = [];
    var glitching = {};
    var isPressed = {};
    function init(elt) {
        elt.addEventListener("keydown", function(e) {
            var code = e.keyCode;
            if (!isPressed[code]) {
                console.log(code);
                isPressed[code] = true;
                targets.forEach(function(target) {
                    if (!glitching[target] && code === maps[target].glitch) {
                        glitching[target] = true;
                        pending.push(new GlitchEvent(target, true));
                    }
                });
            }
        });
        elt.addEventListener("keyup", function(e) {
            var code = e.keyCode;
            delete isPressed[code];
            targets.forEach(function(target) {
                if (glitching[target] && code === maps[target].glitch) {
                    glitching[target] = false;
                    pending.push(new GlitchEvent(target, false));
                }
            });
        });
    }
    function poll() {
        var key;
        var dir;
        events.splice(0, events.length);
        Array.prototype.push.apply(events, pending);
        pending.splice(0, pending.length);
        for (key in isPressed) {
            targets.forEach(function(target) {
                if (maps[target].move.hasOwnProperty(key)) {
                    dir = maps[target].move[key];
                    events.push(new MoveEvent(target, dir));
                }
            });
        }
        return events;
    }
    return {
        init: init,
        poll: poll
    };
}();

var loop = function() {
    var running;
    var world;
    function start() {
        running = true;
        world = new World(1e3, 600, 150);
        world.initial();
        renderer.setup(world);
        tick();
    }
    function stop() {
        running = false;
    }
    function tick() {
        world.process(input.poll());
        world.step(1 / 60);
        renderer.draw(world);
        if (running) {
            window.requestAnimationFrame(tick);
        }
    }
    return {
        start: start,
        stop: stop
    };
}();

function main() {
    input.init(document);
    var container = document.getElementById("main");
    renderer.init(container);
    loop.start();
}

window.addEventListener("load", main);

var renderer = function() {
    var width;
    var height;
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
        hud.ctx.font = "16px Arial";
    }
    function setup(world) {
        width = world.arena.w;
        height = world.arena.h;
        screen.resize(width, height);
        base.resize(width, height);
        bg.resize(width, height);
        hud.resize(width, height);
        preDraw(world);
    }
    function draw(world) {
        clearLayers();
        base.ctx.globalAlpha = .8;
        base.ctx.globalAlpha = 1;
        drawEnt(world.one, "blue");
        drawEnt(world.two, "red");
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
        base.ctx.fillStyle = "green";
        base.drawCircle(ball.body.pos, ball.body.bounds.w / 2);
    }
    function drawScore(score, left) {
        if (left) {
            hud.ctx.fillText("" + score, 20, 20);
        } else {
            hud.ctx.fillText("" + score, hud.width - 100, 20);
        }
    }
    function drawGlitch(world) {
        base.ctx.fillStyle = "black";
        base.drawLine(world.glitch.pointer, world.glitch.target.body.pos);
    }
    function preDraw(world) {
        var midWidth = width / 2;
        var midHeight = height / 2;
        bg.ctx.lineWidth = 10;
        bg.ctx.lineWidth = 2;
        bg.ctx.beginPath();
        bg.ctx.moveTo(midWidth, 0);
        bg.ctx.lineTo(midWidth, midHeight - 10);
        bg.ctx.moveTo(midWidth, midHeight + 10);
        bg.ctx.lineTo(midWidth, height);
        bg.ctx.stroke();
        bg.ctx.lineWidth = 20;
        bg.ctx.strokeStyle = "orange";
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
}();

var MAX_CHARGE = 500;

var DISCHARGE_RATIO = 5;

var SIDE_MARGIN = 50;

var ACC_FACTOR = 350;

var ENT_SIZE = 10;

var BALL_SIZE = 10;

var EventType = {
    INPUT: 1
};

var GameState = {
    FREE: 1,
    GLITCH: 2
};

function World(width, height, goalSize) {
    this.tick = 0;
    this.arena = new Box(0, 0, width, height);
    this.one = {
        left: true,
        charge: 0,
        body: new Body(),
        score: 0
    };
    this.two = {
        left: false,
        charge: 0,
        body: new Body(),
        score: 0
    };
    this.ball = {
        body: new Body(),
        attached: false
    };
    this.state = GameState.FREE;
    this.glitch = {
        target: null,
        pointer: new V()
    };
    this.goalSize = goalSize;
    this._players = [ this.one, this.two ];
    this._entities = [ this.ball, this.two, this.one ];
    this.one.body.bounds.setDim(ENT_SIZE, ENT_SIZE);
    this.two.body.bounds.setDim(ENT_SIZE, ENT_SIZE);
    this.ball.body.bounds.setDim(BALL_SIZE, BALL_SIZE);
}

World.prototype.initial = function() {
    this._newRound(true);
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

World.prototype.step = function(delT) {
    var ball = this.ball;
    var pos;
    var other;
    this.tick += 1;
    if (this.state === GameState.FREE) {
        this._players.forEach(function(player) {
            if (player.charge < MAX_CHARGE) {
                player.charge += 1;
            }
            player.body.acc.normalize();
            player.body.acc.scale(ACC_FACTOR);
            player.body.update(delT);
        });
        if (ball.attached) {
            pos = ball.attached.body.pos;
            ball.body.at(pos.x, pos.y);
            other = ball.attached === this.one ? this.two : this.one;
            if (other.body.bounds.intersects(ball.body.bounds)) {
                this._doSpawn(ball.attached);
                this._doSpawn(other);
                ball.attached = false;
            }
        } else {
            ball.body.update(delT);
            this._players.forEach(function(player) {
                if (player.body.bounds.intersects(ball.body.bounds)) {
                    ball.attached = player;
                }
            });
        }
        this._entities.forEach(function(ent) {
            ent.body.update(delT);
        });
    } else if (this.state === GameState.GLITCH) {
        this.glitch.target.charge -= DISCHARGE_RATIO;
        if (this.glitch.target.charge === 0) {
            console.log("too long");
        }
    } else {
        throw new Error("unknown state");
    }
};

World.prototype.handleInput = function(inputEvent) {
    var target = this._getTarget(inputEvent.target);
    switch (inputEvent.action) {
      case InputAction.MOVE:
        if (this.state === GameState.FREE) {
            target.body.acc.fromDirection(inputEvent.direction);
        } else if (this.state === GameState.GLITCH && target === this.glitch.target) {
            this.glitch.pointer.fromDirection(inputEvent.direction);
        }
        break;

      case InputAction.GLITCH_START:
        if (this.state === GameState.FREE) {
            this.state = GameState.GLITCH;
            this.glitch.target = target;
            this.glitch.pointer.from(target.body.pos);
        }
        break;

      case InputAction.GLITCH_END:
        if (this.state === GameState.GLITCH && target === this.glitch.target) {
            this.glitch.target.body.pos.from(this.glitch.pointer);
            this.glitch.target = null;
            this.state = GameState.FREE;
        }
        break;

      default:
        throw new Error("unknown action");
    }
};

World.prototype._getTarget = function(target) {
    switch (target) {
      case InputTarget.ONE:
        return this.one;

      case InputTarget.TWO:
        return this.two;

      default:
        throw new Error("unknown target");
    }
};

World.prototype._newRound = function(evenStart) {
    if (evenStart) {
        this._doSpawn(this.one);
        this._doStart(this.two);
    } else {
        this._doStart(this.one);
        this._doSpawn(this.two);
    }
    this.ball.body.at(this.arena.w / 2, this.arena.h / 2);
    this.ball.attached = false;
};

World.prototype._doSpawn = function(ent) {
    if (ent.left) {
        ent.body.at(SIDE_MARGIN, this.arena.h / 2);
    } else {
        ent.body.at(this.arena.w - SIDE_MARGIN, this.arena.h / 2);
    }
};

World.prototype._doStart = function(ent) {
    if (ent.left) {
        ent.body.at(this.arena.w / 2 - SIDE_MARGIN, this.arena.h / 2);
    } else {
        ent.body.at(this.arena.w / 2 + SIDE_MARGIN, this.arena.h / 2);
    }
};