#version 300 es
precision highp float;

in vec3 oUV;

out vec4 fragColor;
uniform sampler2D uTexture;
uniform vec3 uCameraPos;
uniform mat4 pvm;

void main() {
    fragColor = texture(uTexture, oUV);
}