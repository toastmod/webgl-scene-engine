#version 300 es

in vec3 aPosition; 
in vec3 aNormal; 
uniform mat4 pvm;

out vec3 oNormal;

void main() {
    oNormal = aNormal;
    gl_Position = pvm * vec4(aPosition, 1.0);
}