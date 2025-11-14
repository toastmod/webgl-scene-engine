#version 300 es
precision highp float;

out vec4 fragColor;
uniform vec3 uColor;

void main() {
    fragColor = vec4(vec3(1.0, 0.0, 0.0) + uColor, 1.0);
}