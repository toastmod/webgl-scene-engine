#version 300 es
precision highp float;

uniform mat4 pvm;
in vec3 aPosition; 
in vec2 aUV; 
out vec2 oUV;


void main() {
    oUV = aUV;
    gl_Position = pvm * vec4(aPosition, 1.0);
}