#version 300 es
precision highp float;

in vec3 oNormal;

out vec4 fragColor;
uniform vec3 uColor;

void main() {
    fragColor = vec4(oNormal, 1.0);
}