/* global loop, graphics, input */

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

function main() {
  var oneKeyMap = {
    move: WSAD_KEY_MAP,
    glitch: V_KEY
  };

  var twoKeyMap = {
    move: ARROW_KEY_MAP,
    glitch: FORWARD_SLASH_KEY
  };

  input.init(document);
  input.activate(0, oneKeyMap);
  input.activate(1, twoKeyMap);
  var container = document.getElementById('main');
  graphics.setRoot(container);
  loop.start();
}

window.addEventListener('load', main);
