precision mediump float;

attribute vec3 a_position;

uniform mat4 u_worldViewProjection;

void main() {
    gl_Position = u_worldViewProjection * vec4(a_position.xyz, 1.);
}

