#version 300 es
precision highp float;

in vec2 oUV;
in vec3 oFragPos;

out vec4 fragColor;
uniform vec3 uCameraPos;
uniform mat4 pvm;
uniform sampler2D uTexture;

void main() {
    vec3 diffuseColor = texture(uTexture, vec2(oUV.x, abs(oUV.y-1.0))).rbg;
    vec3 V = normalize(uCameraPos - oFragPos);
    vec3 N = normalize(oNormal);
    vec3 L = normalize(vec3(10, 10, 10) - oFragPos);
    vec3 diffuse  = max(0.0, dot(N, L) * diffuseColor;
    fragColor = vec3(diffuse, 1.0);
}
