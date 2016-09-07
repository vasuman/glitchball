/* exported input, InputAction, InputTarget */
/* global EventType, Direction */

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

var input = (function() {

  var oneKeyMap = {
    move: WSAD_KEY_MAP,
    glitch: SHIFT_KEY
  };

  var twoKeyMap = {
    move: ARROW_KEY_MAP,
    glitch: ENTER_KEY
  };

  var targets = [InputTarget.ONE, InputTarget.TWO];
  var maps = [oneKeyMap, twoKeyMap];

  var pending = [];
  var events = [];

  var glitching = {};

  // pressed keys
  var isPressed = {
  };

  function init(elt) {
    elt.addEventListener('keydown', function(e) {
      var code = e.keyCode;
      if (!isPressed[code]) {
        isPressed[code] = true;
        targets.forEach(function(target) {
          if (!glitching[target] && code === maps[target].glitch) {
            glitching[target] = true;
            pending.push(new GlitchEvent(target, true));
          }
        });
      }
    });
    elt.addEventListener('keyup', function(e) {
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
      targets.forEach(function (target) {
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
})();
