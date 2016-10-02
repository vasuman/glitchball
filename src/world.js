/* exported EventType, World */
/* global InputAction, InputTarget, Box, V */

var DAMPENING = 0.96;
var DELTA = 1 / 60;
var BALL_MOVE_SMOOTH = 0.7;
var VEL_ZERO = 0.05;
var SIDE_MARGIN = 50;
var PLAYER_DISCHARGE_RATIO = 0.5;
var BALL_SIZE = 50;
var BALL_PUSHBACK = 20000;
var PLAYER_SPREAD = 1.6;
var PLAYER_ACC = 700;
var PLAYER_SIZE = 40;
var PLAYER_FREEZE_DELAY = 100;
var PLAYER_MAX_CHARGE = 500;
var GLITCH_PAD = 10;
var GLITCH_ACC = 1000;
var GLITCH_MIN_CHARGE = 125;
var GLITCH_DEFEND_THRESHOLD = 7;
var GLITCH_DEFEND_INTERVAL = 20;
var GLITCH_DEFEND_SPACING = 800;
var GLITCH_SMOOTH_MOVE = 0.9;
var GLITCH_DRAW_PARAMS = {
      color: [1, 1, 1, 1.0],
      size: PLAYER_SIZE,
      bulb: 1,
      spread: 1.4
};
var GLITCH_LATTICE = {
  layers: 4,
  spread: 60,
  normalParams: {
    color: [0.2, 0.2, 0.2, 1.0],
    size: PLAYER_SIZE,
    bulb: 0.4,
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
}

Body.prototype.stop = function() {
  this.vel.clear();
  this.acc.clear();
}

Body.prototype.pushIn = function(dir) {
  this.acc.fromDirection(dir);
}

Body.prototype.at = function(x, y) {
  this.pos.set(x, y);
  this._reBound();
}

Body.prototype.smoothMoveTo = function(p, smoothness) {
  this.pos.mux(smoothness, p);
  this._reBound();
}

Body.prototype.update = function() {
  this.vel.fAdd(DELTA, this.acc);
  this.pos.fAdd(DELTA, this.vel);
  this.vel.scale(DAMPENING);
  if (this.vel.length() < VEL_ZERO) {
    this.vel.clear();
  }
  this.acc.clear();
  this._reBound();
}

Body.prototype._reBound = function() {
  this.bounds.setCenter(this.pos);
}

function Player(left) {
  this.left = left;
  this.charge = PLAYER_MAX_CHARGE;
  this.body = new Body(PLAYER_SIZE);
  this.score = 0;
  this.frozen = 0;
  this.state = PlayerState.SEEK;
  var color = left ? [1.0, 0.0, 0.0, 1.0] : [0, 1, 0, 1.0];
  this.drawParams = {
    color: color,
    size: PLAYER_SIZE,
    bulb: 1,
    spread: 1.5
  };
}

Player.prototype.discharge = function() {
  this.charge -= PLAYER_DISCHARGE_RATIO;
  return this.charge <= 0;
}

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
  this.body.acc.normalize();
  this.body.acc.scale(PLAYER_ACC);
  this.body.update();
}

Player.prototype.canGlitch = function() {
  return this.state !== PlayerState.SEEK && this.charge > GLITCH_MIN_CHARGE && this.frozen <= 0;
}

Player.prototype.freeze = function() {
  this.frozen = PLAYER_FREEZE_DELAY;
  this.drawParams.bulb = 0;
  this.drawParams.spread = 0;
}

var GameState = {
  FREE: 1,
  GLITCH: 2
};

/**
 * Encapsulates the state of the match.
 */
function World(width, height, goalSize) {
  this.tick = 0;
  this.arena = new Box(0, 0, width, height);
  this.state = GameState.FREE;
  this.glitch = {
    target: null,
    body: new Body(PLAYER_SIZE),
    idx: [0, 0],
    last: 0,
    drawParams: GLITCH_DRAW_PARAMS
  };
  this._latticeV = new V();
  this.goalSize = goalSize;
}

World.prototype.init = function() {
  this._initEntities();
  this._start(true);
}

World.prototype.process = function(events) {
  var self = this;
  events.forEach(function(event) {
    switch (event.type) {
        case EventType.INPUT:
            self.handleInput(event);
            break;
        default:
            throw new Error('unknown event type');
    }
  });
}

World.prototype.step = function() {
  this.tick += 1;
  if (this.state === GameState.FREE) {
    this._updatePlayers();
    this._updateBall();
  } else if (this.state === GameState.GLITCH) {
    this._updateGlitch();
  } else {
    throw new Error('unknown state');
  }
}

World.prototype.handleInput = function(inputEvent) {
  var target = this._getTarget(inputEvent.source);
  switch (inputEvent.action) {
      case InputAction.MOVE:
          if (this.state === GameState.FREE) {
            target.body.pushIn(inputEvent.direction);
          } else if (this.state === GameState.GLITCH) {
            if (target === this.glitch.target) {
              this._moveGlitch(inputEvent.direction);
            }
          }
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
          throw new Error('unknown action');
  }
}

World.prototype._initEntities = function() {
  this.players = [new Player(true), new Player(false)];
  this.starter = this.players[0];
  this.ball = {
    body: new Body(BALL_SIZE),
    attached: false,
    drawParams: {
      color: [1, 1, 0, 1.0],
      size: BALL_SIZE,
      bulb: 1,
      spread: 1.3
    }
  };
}

World.prototype._updatePlayers = function() {
  var pushF = 1;
  for (var i = 0; i < this.players.length; i++) {
    var player = this.players[i];
    player.update();
    // kill out of bounds player
    if (!this.arena.within(player.body.pos)) {
      if (this.ball.attached === player) {
        if (Math.abs(player.body.pos.y - this.arena.h / 2) < this.goalSize) {
          if ((!player.left && player.body.pos.x < 0) ||
              (player.left && player.body.pos.x > this.arena.w)) {
            player.score += 1;
            pushF = 2;
          }
        }
        // push toward center
        this.arena.center(this.ball.body.acc);
        this.ball.body.acc.sub(this.ball.body.pos);
        this.ball.body.acc.normalize();
        this.ball.body.acc.scale(pushF * BALL_PUSHBACK);
        this._endPlay();
      }
      this._doSpawn(player);
    }
  }
}

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
      // this._doSpawn(other);
      // this.ball.attached = false;
      // player.state = other.state = PlayerState.SEEK;
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
}

World.prototype._beginGlitch = function(target) {
  this.state = GameState.GLITCH;
  this.glitch.target = target;
  this.glitch.body.from(target.body);
  if (target.state === PlayerState.DEFEND) {
    this._initLattice(target);
  }
}

World.prototype._moveGlitch = function(dir) {
  if (this.glitch.target.state === PlayerState.ATTACK) {
    this.glitch.body.pushIn(dir);
  } else {
    this._moveLattice(dir);
  }
}

World.prototype._updateGlitch = function() {
  var target = this.glitch.target;
  if (target.discharge()) {
    this._endGlitch();
    return;
  }
  if (target.state === PlayerState.ATTACK) {
    var body = this.glitch.body;
    body.acc.normalize();
    body.acc.scale(GLITCH_ACC);
    body.update();
  }
}

World.prototype._endGlitch = function() {
  if (this.glitch.target.state === PlayerState.ATTACK) {
    this.glitch.target.body.from(this.glitch.body);
    var p = this.glitch.body.pos;
    this.ball.body.at(p.x, p.y)
  } else {
    var idx = this.glitch.idx;
    var p = this._latticePoint(idx[0], idx[1], this.glitch.target.left);
    this.glitch.target.body.at(p.x, p.y);
  }
  this.glitch.target = null;
  this.state = GameState.FREE;
}

World.prototype._initLattice = function(target) {
  this.glitch.last = 0;
  var pos = target.body.pos;
  var dX = this.arena.w / 2 - pos.x;
  if (!target.left) {
    dX = Math.abs(dX);
  }
  this.glitch.idx = [0, 0];
}

World.prototype._moveLattice = function(dir) {
  if (this.tick - this.glitch.last < GLITCH_DEFEND_INTERVAL) {
    return;
  }
  var idx = this.glitch.idx;
  var n = GLITCH_LATTICE.layers;
  var ent = this.glitch.target;
  if ((dir === Direction.RIGHT && ent.left) || (dir === Direction.LEFT && !ent.left)) {
    idx[0] = Math.max(0, idx[0] - 1);
    idx[1] = Math.min(idx[0] === 0 ? 0 : 2, idx[1])
  } else if ((dir === Direction.LEFT && ent.left) || (dir === Direction.RIGHT && !ent.left)) {
    idx[0] = Math.min(n - 1, idx[0] + 1);
    if (idx[0] === 1) {
      idx[1] = 1;
    }
  } else if (dir === Direction.UP) {
    idx[1] = Math.min(idx[0] === 0 ? 0 : 2, idx[1] + 1)
  } else if (dir === Direction.DOWN) {
    idx[1] = Math.max(0, idx[1] - 1)
  } else {
    throw new Error('unknown case');
  }
  this.glitch.last = this.tick;
}

World.prototype._eachLattice = function(left, f) {
  for (var i = 0; i < GLITCH_LATTICE.layers; i++) {
    var k = (i === 0) ? 1 : 3;
    for (var j = 0; j < k; j++) {
      var p = this._latticePoint(i, j, left);
      f(i, j, p);
    }
  }
}


World.prototype._latticePoint = function(i, j, left) {
  var pos = this._latticeV;
  var spaceX = this.arena.w / (2 * GLITCH_LATTICE.layers)
  var dir = left ? -1 : 1;
  pos.x = this.arena.w / 2 + dir * i * spaceX;
  pos.y = this.arena.h / 2;
  if (i !== 0) {
    var angle = (j - 1) * GLITCH_LATTICE.spread / 360 * Math.PI;
    pos.y += Math.tan(angle) * i * spaceX;
  }
  return pos;
}

World.prototype._newPlay = function(player) {
  this.ball.body.stop();
  this.ball.attached = player;
  player.state = PlayerState.ATTACK;
  var other = this._getOther(player);
  other.state = PlayerState.DEFEND;
}

World.prototype._endPlay = function() {
  var player = this.ball.attached;
  this.ball.attached = false;
  var other = this._getOther(player);
  other.state = player.state = PlayerState.SEEK;
}

World.prototype._getTarget = function(source) {
  return this.players[source];
}

World.prototype._getOther = function(player) {
  return (player === this.players[0]) ? this.players[1] : this.players[0];
}

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
}

World.prototype._doSpawn = function(ent) {
  ent.freeze();
  var space = this.goalSize + SIDE_MARGIN;
  if (ent.left) {
    ent.body.at(space, this.arena.h / 2);
    ent.body.stop();
  } else {
    ent.body.at(this.arena.w - space, this.arena.h / 2);
    ent.body.stop();
  }
}

World.prototype._doStart = function(ent) {
  ent.freeze();
  var space = this.goalSize + SIDE_MARGIN;
  if (ent.left) {
    ent.body.at(this.arena.w / 2 - space, this.arena.h / 2);
    ent.body.stop();
  } else {
    ent.body.at(this.arena.w / 2 + space, this.arena.h / 2);
    ent.body.stop();
  }
}
