/* global loop, graphics, input */

function main() {
  input.init(document);
  var container = document.getElementById('main');
  graphics.init(container);
  loop.start();
}

window.addEventListener('load', main);
