/* exported input, InputAction, InputTarget */
/* global EventType, Direction */


var SHIFT_KEY = 16;
var SPACE_KEY = 32;

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

var oneKeyMap = {
  move: WSAD_KEY_MAP,
  glitch: SHIFT_KEY
};

var twoKeyMap = {
  move: ARROW_KEY_MAP,
  glitch: SPACE_KEY
};

var InputAction = {
  MOVE: 1,
  GLITCH: 2
};

var InputTarget = {
  ONE: 1,
  TWO: 2
};

function MoveEvent(target, direction) {
  this.type = EventType.INPUT;
  this.action = InputAction.MOVE;
  this.target = target;
  this.direction = direction;
}

var input = (function() {

  var pending = [];
  var events = [];

  // pressed keys
  var isPressed = {
  };

  function init(elt) {
    elt.addEventListener('keydown', function(e) {
      var code = e.keyCode;
      if (!isPressed[code]) {
        isPressed[code] = true;
        if (code === oneKeyMap.glitch) {
          code.x();
        } else if (code === twoKeyMap.glitch) {
          code.x();
        }
      }
    });
    elt.addEventListener('keyup', function(e) {
      delete isPressed[e.keyCode];
    });
  }

  function poll() {
    var key;
    var dir;
    events.splice(0, events.length);
    pending.splice(0, pending.length);
    for (key in isPressed) {
      if (oneKeyMap.move.hasOwnProperty(key)) {
        dir = oneKeyMap.move[key];
        events.push(new MoveEvent(InputTarget.ONE, dir));
      } else if (twoKeyMap.move.hasOwnProperty(key)) {
        dir = twoKeyMap.move[key];
        events.push(new MoveEvent(InputTarget.TWO, dir));
      }
    }
    return events;
  }

  return {
    init: init,
    poll: poll
  };
})();
