/* exported reducer */

function reducer(world, inputs) {
  function phys(ent) {
    ent.update();
  }

  world.player.acc.set(inputs.player);
  var entities = [world.player, world.ball, world.other];
  entities.forEach(phys);
  // update player
  // update other
  // update ball
}
