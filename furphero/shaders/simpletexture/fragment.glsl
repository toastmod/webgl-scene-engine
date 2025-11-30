#version 300 es
precision highp float;

in vec2 oUV;

out vec4 fragColor;
uniform vec3 uCameraPos;
uniform mat4 pvm;

void main() {
    fragColor = vec4(oUV,0.0,1.0);
}