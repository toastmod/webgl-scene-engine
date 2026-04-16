#version 300 es
precision highp float;

in vec3 aNormal;
in vec3 aPosition;

out vec3 oNormal;
out vec3 oFragPos;

uniform mat4 pvm;
uniform mat4 normalMat;

void main() {
    oNormal = (normalMat * vec4(aNormal, 0.0)).xyz;
    gl_Position = pvm * vec4(aPosition, 1.0);
    oFragPos = gl_Position.xyz;
}
