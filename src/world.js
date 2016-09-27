/* exported EventType, World */
/* global InputAction, InputTarget, Box, V */

var DAMPENING = 0.96;
var DELTA = 1 / 60;
var MOVE_SMOOTH = 0.8;
var VEL_ZERO = 0.05;
var MAX_CHARGE = 500;
var GLITCH_SPEED = 8;
var GLITCH_MIN_CHARGE = 125;
var DISCHARGE_RATIO = 5;
var SIDE_MARGIN = 50;
var ACC_FACTOR = 750;
var PLAYER_SIZE = 40;
var BALL_SIZE = 50;
var GLITCH_PAD = 10;
var BALL_PUSHBACK = 20000;

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

Body.prototype.at = function(x, y) {
  this.pos.set(x, y);
  this._reBound();
}

Body.prototype.stop = function() {
  this.vel.clear();
  this.acc.clear();
}

Body.prototype.smoothMoveTo = function(p) {
  this.pos.mux(MOVE_SMOOTH, p);
  this._reBound();
}

Body.prototype._reBound = function() {
  this.bounds.setCenter(this.pos);
}

function Player(left) {
  this.left = left;
  this.charge = MAX_CHARGE;
  this.body = new Body(PLAYER_SIZE);
  this.score = 0;
  this.state = PlayerState.SEEK;
}

Player.prototype.moveIn = function(dir) {
  this.body.acc.fromDirection(dir);
}

Player.prototype.discharge = function() {
  this.charge -= DISCHARGE_RATIO;
  return this.charge <= 0;
}

Player.prototype.update = function() {
    if (this.charge < MAX_CHARGE) {
      this.charge += 1;
    }
    this.body.acc.normalize();
    this.body.acc.scale(ACC_FACTOR);
    this.body.update();
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
    pointer: new V(),
    delta: new V()
  };
  this.goalSize = goalSize;
}

World.prototype.init = function() {
  this._initEntities();
  this._newRound(true);
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
            target.moveIn(inputEvent.direction);
          } else if (this.state === GameState.GLITCH) {
            if (target === this.glitch.target) {
              this.glitch.delta.fromDirection(inputEvent.direction);
            }
          }
          break;
      case InputAction.GLITCH_START:
          if (this.state === GameState.FREE) {
            if (target.charge > GLITCH_MIN_CHARGE) {
              this._startGlitch(target);
            }
          }
          break;
      case InputAction.GLITCH_END:
          if (this.state === GameState.GLITCH) {
            if (target === this.glitch.target) {
              this._endGlitch(target);
            }
          }
          break;
      default:
          throw new Error('unknown action');
  }
}

World.prototype._initEntities = function() {
  this.players = [new Player(true), new Player(false)];
  this.ball = {
    body: new Body(BALL_SIZE),
    attached: false
  };
}

World.prototype._updatePlayers = function() {
  for (var i = 0; i < this.players.length; i++) {
    var player = this.players[i];
    player.update();
    // kill out of bounds player
    if (!this.arena.within(player.body.pos)) {
      if (this.ball.attached === player) {
        if (Math.abs(player.body.pos.y - this.arena.h / 2) < this.goalSize) {
          if ((!player.left && player.body.pos.x < 0) || (player.left && player.body.pos.x > this.arena.w)) {
            player.score += 1;
          }
        }
        // gravitate toward center
        this.arena.center(this.ball.body.acc);
        this.ball.body.acc.sub(this.ball.body.pos);
        this.ball.body.acc.normalize();
        this.ball.body.acc.scale(BALL_PUSHBACK);
        this.ball.attached = false;
        player.state = PlayerState.SEEK;
      }
      this._doSpawn(player);
    }
  }
}

World.prototype._updateBall = function() {
  if (this.ball.attached) {
    var pos = this.ball.attached.body.pos;
    this.ball.body.smoothMoveTo(pos);
    var player = this.ball.attached;
    var other = this._getOther(player);
    if (other.body.bounds.intersects(this.ball.body.bounds)) {
      // kill attached
      this._doSpawn(player);
      // kill attacker
      this._doSpawn(other);
      this.ball.attached = false;
      other.state = player.state = PlayerState.SEEK;
    }
  } else {
    this.ball.body.update();
    for (var i = 0; i < this.players.length; i++) {
      var player = this.players[i];
      if (player.body.bounds.intersects(this.ball.body.bounds)) {
        this.ball.body.stop();
        this.ball.attached = player;
        player.state = PlayerState.ATTACK;
      }
    }
  }
}

World.prototype._startGlitch = function(target) {
  this.state = GameState.GLITCH;
  this.glitch.target = target;
  this.glitch.pointer.from(target.body.pos);
}

World.prototype._updateGlitch = function() {
  if (this.glitch.target.discharge()) {
    console.log('too long');
    this._endGlitch();
    return;
  }
  this.glitch.delta.normalize();
  this.glitch.pointer.fAdd(GLITCH_SPEED, this.glitch.delta);
  this.glitch.pointer.limit(this.arena, GLITCH_PAD);
  this.glitch.delta.clear();
}

World.prototype._endGlitch = function() {
  var p = this.glitch.pointer;
  this.glitch.target.body.pos.from(p);
  if (this.glitch.target === this.ball.attached) {
    this.ball.body.at(p.x, p.y)
  }
  this.glitch.target = null;
  this.state = GameState.FREE;
}

World.prototype._getTarget = function(source) {
  return this.players[source];
}

World.prototype._getOther = function(player) {
  return (player === this.players[0]) ? this.players[1] : this.players[0];
}

World.prototype._newRound = function() {
  this._doSpawn(this.players[0]);
  this._doSpawn(this.players[1]);
  this.ball.body.at(this.arena.w / 2, this.arena.h / 2);
  this.ball.attached = false;
}

World.prototype._doSpawn = function(ent) {
  var space = this.goalSize + SIDE_MARGIN;
  if (ent.left) {
    ent.body.at(space, this.arena.h / 2);
    ent.body.stop();
  } else {
    ent.body.at(this.arena.w - space, this.arena.h / 2);
    ent.body.stop();
  }
}
