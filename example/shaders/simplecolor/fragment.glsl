#version 300 es
precision highp float;

in vec3 oNormal;
in vec3 oFragPos;

out vec4 fragColor;

uniform vec3 uCameraPos;
uniform mat4 pvm;
uniform vec3 uColor;

uniform float uMaxFade; 
uniform float uMinFade; 

// uniform float uTime; 

void main() {
    // Corrected texture sampling
    vec3 diffuseColor = uColor;

    // Distance fade
    float alpha = uMinFade - oFragPos.z / (uMaxFade - uMinFade); 

    // Normalize vectors
    vec3 N = normalize(oNormal);

    vec3 V = normalize(uCameraPos - oFragPos);
    vec3 L = normalize(vec3(0.0, 6.0, 6.0) - oFragPos);

    // Lambert diffuse
    float diff = max(dot(N, L), 0.0);
    vec3 diffuse = diff * diffuseColor + vec3(0.05, 0.05, 0.1);

    // Assign a vec4 to fragColor (RGBA)
    fragColor = vec4(diffuse, alpha);
}
