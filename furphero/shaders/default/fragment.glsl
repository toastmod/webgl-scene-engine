#version 300 es
precision highp float;

in vec3 oNormal;

out vec4 fragColor;
uniform vec3 uColor;
uniform vec3 uCameraPos;
uniform mat4 pvm;

void main() {
    vec3 op = oNormal / uCameraPos;
    fragColor = vec4(op, 1.0);
}