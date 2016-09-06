/* exported EventType, World */
/* global InputAction, InputTarget, Body, Box, V */

var MAX_CHARGE = 500;
var DISCHARGE_RATIO = 5;
var SIDE_MARGIN = 50;
var ACC_FACTOR = 450;
var ENT_SIZE = 10;
var BALL_SIZE = 10;

var EventType = {
  INPUT: 1
};

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
  this.ball = {
    body: new Body(),
    attached: false
  };
  this.state = GameState.FREE;
  this.glitch = {
    target: null,
    pointer: new V(),
    delta: new V()
  };
  this.goalSize = goalSize;
  var one = {
    left: true,
    charge: 0,
    body: new Body(),
    score: 0
  };
  var two = {
    left: false,
    charge: 0,
    body: new Body(),
    score: 0
  };
  this.players = [one, two];
}

World.prototype.initial = function() {
  this.players[0].body.bounds.setDim(ENT_SIZE, ENT_SIZE);
  this.players[1].body.bounds.setDim(ENT_SIZE, ENT_SIZE);
  this.ball.body.bounds.setDim(BALL_SIZE, BALL_SIZE);
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

World.prototype.step = function(delT) {
  this.tick += 1;
  if (this.state === GameState.FREE) {
    for (var i = 0; i < this.players.length; i++) {
      var player = this.players[i];
      if (player.charge < MAX_CHARGE) {
        player.charge += 1;
      }
      player.body.acc.normalize();
      player.body.acc.scale(ACC_FACTOR);
      player.body.update(delT);
      if (!this.arena.contains(player.body.bounds)) {
        if (this.ball.attached === player) {
          this.ball.attached = false;
          // push to center;
          this.arena.center(this.ball.body.acc);
          this.ball.body.acc.sub(this.ball.body.pos);
          this.ball.body.acc.scale(10);
        }
        this._doSpawn(player);
      }
    }
    if (this.ball.attached) {
      var pos = this.ball.attached.body.pos;
      this.ball.body.at(pos.x, pos.y);
      var other = this._getOther(this.ball.attached);
      if (other.body.bounds.intersects(this.ball.body.bounds)) {
        // kill attached
        this._doSpawn(this.ball.attached);
        // kill attacher
        this._doSpawn(other);
        this.ball.attached = false;
      }
    } else {
      this.ball.body.update(delT);
      for (var i = 0; i < this.players.length; i++) {
        var player = this.players[i];
        if (player.body.bounds.intersects(this.ball.body.bounds)) {
          this.ball.attached = player;
        }
      }
    }
  } else if (this.state === GameState.GLITCH) {
    this.glitch.target.charge -= DISCHARGE_RATIO;
    if (this.glitch.target.charge === 0) {
      console.log('too long');
    }
    this.glitch.delta.normalize();
    this.glitch.pointer.add(this.glitch.delta);
    this.glitch.pointer.limit(this.arena, ENT_SIZE);
    this.glitch.delta.clear();
  } else {
    throw new Error('unknown state');
  }
}

World.prototype.handleInput = function(inputEvent) {
  var target = this._getTarget(inputEvent.target);
  switch (inputEvent.action) {
      case InputAction.MOVE:
          if (this.state === GameState.FREE) {
            target.body.acc.fromDirection(inputEvent.direction);
          } else if (this.state === GameState.GLITCH
                     && target === this.glitch.target) {
            this.glitch.delta.fromDirection(inputEvent.direction);
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
          throw new Error('unknown action');
  }
}

World.prototype._getTarget = function(target) {
  switch (target) {
      case InputTarget.ONE:
          return this.players[0];
      case InputTarget.TWO:
          return this.players[1];
      default:
          throw new Error('unknown target');
  }
}

World.prototype._getOther = function(player) {
  return (player === this.players[0]) ? this.players[1] : this.players[0];
}

World.prototype._newRound = function(evenStart) {
  if (evenStart) {
    this._doSpawn(this.players[0]);
    this._doStart(this.players[1]);
  } else {
    this._doStart(this.players[0]);
    this._doSpawn(this.players[1]);
  }

  this.ball.body.at(this.arena.w / 2, this.arena.h / 2);
  this.ball.attached = false;
}

World.prototype._doSpawn = function(ent) {
  if (ent.left) {
    ent.body.at(SIDE_MARGIN, this.arena.h / 2);
    ent.body.stop();
  } else {
    ent.body.at(this.arena.w - SIDE_MARGIN, this.arena.h / 2);
    ent.body.stop();
  }
}

World.prototype._doStart = function(ent) {
  if (ent.left) {
    ent.body.at(this.arena.w / 2 - SIDE_MARGIN, this.arena.h / 2);
    ent.body.stop();
  } else {
    ent.body.at(this.arena.w / 2 + SIDE_MARGIN, this.arena.h / 2);
    ent.body.stop();
  }
}
