#version 300 es
precision highp float;

in vec2 oUV;

out vec4 fragColor;
uniform vec3 uCameraPos;
uniform mat4 pvm;
uniform sampler2D uTexture;

void main() {
    fragColor = texture(uTexture, vec2(oUV.x, abs(oUV.y-1.0)));
}