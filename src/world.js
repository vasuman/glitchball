/* exported EventType, World */
/* global InputAction, InputTarget, Body, Box, V */

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

/**
 * Encapsulates the state of the match.
 */
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
  this._players = [this.one, this.two];
  this._entities = [this.ball, this.two, this.one];
  this.one.body.bounds.setDim(ENT_SIZE, ENT_SIZE);
  this.two.body.bounds.setDim(ENT_SIZE, ENT_SIZE);
  this.ball.body.bounds.setDim(BALL_SIZE, BALL_SIZE);
}

World.prototype.initial = function() {
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
        // kill attached
        this._doSpawn(ball.attached);
        this._doSpawn(other);
        // switch attached
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
      console.log('too long');
    }
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
            // TODO: check pointer within bounds
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
          return this.one;
      case InputTarget.TWO:
          return this.two;
      default:
          throw new Error('unknown target');
  }
}

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
}

World.prototype._doSpawn = function(ent) {
  if (ent.left) {
    ent.body.at(SIDE_MARGIN, this.arena.h / 2);
  } else {
    ent.body.at(this.arena.w - SIDE_MARGIN, this.arena.h / 2);
  }
}

World.prototype._doStart = function(ent) {
  if (ent.left) {
    ent.body.at(this.arena.w / 2 - SIDE_MARGIN, this.arena.h / 2);
  } else {
    ent.body.at(this.arena.w / 2 + SIDE_MARGIN, this.arena.h / 2);
  }
}
