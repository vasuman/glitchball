precision mediump float;
const float heightScale = 35.;

attribute vec3 a_position;

uniform mat4 u_worldViewProjection;

varying float v_darkness;

void main() {
    v_darkness = a_position.z;
    gl_Position = u_worldViewProjection * vec4(a_position.xy, a_position.z * heightScale, 1.);
}

