#version 300 es
precision highp float;

in vec2 oUV;
in vec3 oNormal;
in vec3 oFragPos;

out vec4 fragColor;

uniform vec3 uCameraPos;
uniform mat4 pvm;
uniform sampler2D uTexture;

uniform float uTime;
uniform float uMaxFade;
uniform float uMinFade;

vec3 lcolours[4];
float lradaii[4];
float lheight[4];
float lspeed[4];

const float shine = 4.0;

void main() {
    // do not judge me for my sins
    lradaii[0] = 0.5; lradaii[1] = 1.5; lradaii[2] = 2.3; lradaii[3] = 2.5;
    lheight[0] = 5.0; lheight[1] = 3.5; lheight[2] = 1.5; lheight[3] = 1.7; // 67
    lspeed[0] = 0.0005; lspeed[1] = 0.0002; lspeed[2] = 0.001; lspeed[3] = 0.0008;
    lcolours[0] = vec3(0.0, 0.0, 0.9);
    lcolours[1] = vec3(0.0, 0.1, 0.0);
    lcolours[2] = vec3(0.976, 0.624, 1);
    lcolours[3] = vec3(0, 0.9, 0.0);


    // Corrected texture sampling
    vec3 diffuseColor = texture(uTexture, vec2(oUV.x, abs(oUV.y - 1.0))).rgb;

    // Distance fade
    float alpha = uMinFade - oFragPos.z / (uMaxFade - uMinFade);

    // Normalize vectors
    vec3 N = normalize(oNormal);
    vec3 V = normalize(uCameraPos - oFragPos);

    vec3 C = vec3(0, 0, 0);

    for (int i = 0; i < 4; i++) {
        vec3 lightPos = vec3(
            lradaii[i]*cos(uTime*lspeed[i]),
            lheight[i],
            lradaii[i]*sin(uTime*lspeed[i]));

        float distance = length(lightPos - oFragPos);
        const float k_c = 0.0;
        const float k_l = 1.0;
        const float k_q = 1.0;
        float attenuation = 1.0/(k_c + k_l * distance + k_q * distance * distance);
        attenuation *= 2.0;
        // Lambert diffuse
        vec3 L = normalize(lightPos - oFragPos);
        float diffFactor = max(dot(N, L), 0.0);
        vec3 diffuse = diffFactor * lcolours[i] * diffuseColor;

        // Now we go specular
        vec3 H = normalize(V + L);
        float specFactor = pow(max(dot(N, H), 0.0), shine);
        vec3 specular = specFactor*lcolours[i];


        C += attenuation * (diffuse + specular);
    }

    const vec3 ambient = vec3(0.1, 0.11, 0.2);
    // Assign a vec4 to fragColor (RGBA)
    fragColor = vec4(C + ambient, alpha);
}
