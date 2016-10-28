precision mediump float;

const float goalFactor = 2.;
const float mixPow = 2.;
const vec4 black = vec4(0., 0., 0., 1.0);
const vec4 yellow = vec4(0., 0., 1., 1.0);

uniform vec3 u_offset;
uniform vec3 u_point;
uniform float u_coreSize;
uniform vec4 u_color;
uniform mat4 u_worldViewProjection;
uniform vec2 u_boundMin;
uniform vec2 u_boundMax;
uniform float u_bulb;
uniform float u_wireRatio;
uniform float u_goalSize;

attribute vec3 a_position;

varying vec4 v_color;

void main() {
    float wireRadius = u_coreSize * u_wireRatio;
    float halfX = (u_boundMin.x + u_boundMax.x) / 2.;
    float halfY = (u_boundMin.y + u_boundMax.y) / 2.;
    vec4 pos = vec4(a_position + u_offset, 1.0);
    float dist = abs(length(a_position - (u_point - u_offset)));
    float influence = 0.0;
    v_color = black;
    if (pos.x > u_boundMin.x && pos.y > u_boundMin.y && pos.x < u_boundMax.x && pos.y < u_boundMax.y) {
        if (dist < u_coreSize) {
            influence = sqrt(pow(u_coreSize, 2.0) - pow(dist, 2.0)) / u_coreSize;
        }
        if (dist < wireRadius) {
            float frac = dist / wireRadius;
            influence += 0.1 * (1. - frac);
            vec4 color = u_color;
            float mirX = (pos.x > halfX) ? u_boundMax.x - pos.x : pos.x;
            float mirY = (pos.y > halfY) ?  pos.y - halfY : halfY - pos.y;
            if (mirX <= u_goalSize && mirY <= u_goalSize) {
                color = mix(color, yellow, 0.5);
                influence *= goalFactor * pow(max(mirX, mirY) / u_goalSize, 2.);
            }
            v_color = mix(color, black, pow(frac, mixPow));
        }
        pos.z += influence * u_coreSize * u_bulb;
    }
    gl_Position = u_worldViewProjection * pos;
}
