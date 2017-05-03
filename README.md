# Glitchball

A competitive multiplayer game.

[Play here][1]

### Rules

* There are two players and the aim of this game is to get the ball (yellow thing)
  to the other players *goal*.

* Once you have the ball, if the other player touches you, you die and respawn
  next to your goal and the other player gets possesion of the ball.

* When the attacking player *glitches*, the defending player is frozen and the
  attacking player can move like they normally do.

* When the defending player *glitches*, the attacking player is frozen and the
  defending player can teleport to any point on the defensive matrix.

### Controls

The green player moves with the *arrow keys* and glitches with the slash (`/`)
key.

The red player moves with the `WSAD` keys and glitches with the `V` key.

### Graphics

The game features a simple yet refreshing aesthetic style based on fields. The 
concept is that there is a fixed grid mesh and all entities (players, ball)
are disturbances on this substrate. I used a tiny WebGL wrapper [library][2] and
wrote a couple of shaders in GLSL to achieve the desired effect.

[1]: //varav.in/glitchball
[2]: http://twgljs.org/
