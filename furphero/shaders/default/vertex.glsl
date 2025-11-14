#version 300 es

in vec3 aPosition; 
uniform mat4 pvm;

void main() {
    gl_Position = pvm * vec4(aPosition, 1.0);
}