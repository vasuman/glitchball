/* exported input, InputAction, InputTarget */
/* global Direction */

var INPUT_DELAY = 200;

var InputAction = {
  GLITCH_BEGIN: 2,
  GLITCH_END: 3,
  MOVE_BEGIN: 4,
  MOVE_END: 5
};

function MoveEvent(source, direction, start) {
  this.action = start ? InputAction.MOVE_BEGIN : InputAction.MOVE_END;
  this.source = source;
  this.direction = direction;
}

function GlitchEvent(source, start) {
  this.action = start ? InputAction.GLITCH_BEGIN : InputAction.GLITCH_END;
  this.source = source;
}

var input = (function() {

  var active = [];
  var maps = [];
  var pending = [];
  var events = [];
  var isPressed = {};

  function delay(cb) {
    return function(e) {
      setTimeout(function() {
        cb(e)
      }, INPUT_DELAY);
    }
  }

  function trapKey(start, key) {
    for (var source = 0; source < active.length; source++) {
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
    elt.addEventListener('keydown', delay(function(e) {
      var code = e.keyCode;
      if (!isPressed[code]) {
        isPressed[code] = true;
        trapKey(true, code);
      }
    }));
    elt.addEventListener('keyup', delay(function(e) {
      var code = e.keyCode;
      if (isPressed[code]) {
        trapKey(false, code);
        delete isPressed[code];
      }
    }));
  }

  function activate(i, map) {
    active[i] = true;
    maps[i] = map;
  }

  function poll() {
    var key;
    var dir;
    events.splice(0, events.length);
    Array.prototype.push.apply(events, pending);
    pending.splice(0, pending.length);
    return events;
  }

  return {
    activate: activate,
    init: init,
    poll: poll
  };
})();
