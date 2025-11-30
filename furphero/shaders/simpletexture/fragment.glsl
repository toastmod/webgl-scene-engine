#version 300 es
precision highp float;

in vec2 oUV;
in vec3 oNormal;
in vec3 oFragPos;

out vec4 fragColor;

uniform vec3 uCameraPos;
uniform mat4 pvm;
uniform sampler2D uTexture;

void main() {
    // Corrected texture sampling
    vec3 diffuseColor = texture(uTexture, vec2(oUV.x, abs(oUV.y - 1.0))).rgb;

    // Normalize vectors
    vec3 N = normalize(oNormal);
    vec3 V = normalize(uCameraPos - oFragPos);
    vec3 L = normalize(vec3(10.0, 10.0, 10.0) - oFragPos);

    // Lambert diffuse
    float diff = max(dot(N, L), 0.0);
    vec3 diffuse = diff * diffuseColor;

    // Assign a vec4 to fragColor (RGBA)
    fragColor = vec4(diffuse, 1.0);
}
