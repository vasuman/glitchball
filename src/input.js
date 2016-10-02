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
  GLITCH_BEGIN: 2,
  GLITCH_END: 3
};

function MoveEvent(source, direction) {
  this.type = EventType.INPUT;
  this.action = InputAction.MOVE;
  this.source = source;
  this.direction = direction;
}

function GlitchEvent(source, start) {
  this.type = EventType.INPUT;
  this.action = start ? InputAction.GLITCH_BEGIN : InputAction.GLITCH_END;
  this.source = source;
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

  var sources = [0, 1];
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
        for (var source = 0; source <= 1; source++) {
          if (!glitching[source] && code === maps[source].glitch) {
            glitching[source] = true;
            pending.push(new GlitchEvent(source, true));
          }
        }
      }
    });
    elt.addEventListener('keyup', function(e) {
      var code = e.keyCode;
      delete isPressed[code];
      for (var source = 0; source <= 1; source++) {
        if (glitching[source] && code === maps[source].glitch) {
          glitching[source] = false;
          pending.push(new GlitchEvent(source, false));
        }
      }
    });
  }

  function poll() {
    var key;
    var dir;
    events.splice(0, events.length);
    Array.prototype.push.apply(events, pending);
    pending.splice(0, pending.length);
    for (key in isPressed) {
      for (var source = 0; source <= 1; source++) {
        if (maps[source].move.hasOwnProperty(key)) {
          dir = maps[source].move[key];
          events.push(new MoveEvent(source, dir));
        }
      };
    }
    return events;
  }

  return {
    init: init,
    poll: poll
  };
})();
