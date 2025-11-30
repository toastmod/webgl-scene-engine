#version 300 es
precision highp float;

uniform mat4 pvm;
in vec3 aPosition;
in vec2 aUV;
out vec2 oUV;
out vec3 oFragPos;


void main() {
    oUV = aUV;
    oFragPos = pvm * vec4(aPosition, 1.0);
    gl_Position = oFragPos;
}
