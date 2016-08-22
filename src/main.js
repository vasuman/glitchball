/* global loop, renderer, input */

function main() {
  input.init(document);
  var container = document.getElementById('main');
  renderer.init(container);
  loop.start();
}

window.addEventListener('load', main);
