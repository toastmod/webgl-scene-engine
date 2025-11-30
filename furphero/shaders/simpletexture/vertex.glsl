#version 300 es

in vec3 aPosition; 
in vec2 aUV; 
uniform mat4 pvm;

out vec3 oUV;

void main() {
    oUV = aUV;
    gl_Position = pvm * vec4(aPosition, 1.0);
}