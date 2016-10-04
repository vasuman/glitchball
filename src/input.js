/* exported input, InputAction, InputTarget */
/* global EventType, Direction */

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

var input = (function() {

  var oneKeyMap = {
    move: WSAD_KEY_MAP,
    glitch: V_KEY
  };

  var twoKeyMap = {
    move: ARROW_KEY_MAP,
    glitch: FORWARD_SLASH_KEY
  };

  var sources = [0, 1];
  var maps = [oneKeyMap, twoKeyMap];
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
    elt.addEventListener('keydown', function(e) {
      var code = e.keyCode;
      if (!isPressed[code]) {
        isPressed[code] = true;
        trapKey(true, code);
      }
    });
    elt.addEventListener('keyup', function(e) {
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
    for (key in isPressed) {
    }
    return events;
  }

  return {
    init: init,
    poll: poll
  };
})();
