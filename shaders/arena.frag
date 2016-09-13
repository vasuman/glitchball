precision mediump float;

const vec4 black = vec4(0., 0., 0., 0.0);

uniform vec4 u_color;

varying float v_darkness;

void main() {
    gl_FragColor = mix(u_color, black, pow(v_darkness, 0.6));
}
