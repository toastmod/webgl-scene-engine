const state = new GPUState();
const engine = new Engine();

const reader = new FileReader();

const loadingBar = document.getElementById("progbar");

const baseMusicVol = 0.1;
const noteDelay = 3;

// Define rendering pipeline layout for GPU state
state
    .init({
        programs: {
            simplecolor: new Program({
                // Shader program source code
                source: "example/shaders/simplecolor",

                // Vertex attribute layout
                attributes: {
                    aPosition: "vec3",
                    aNormal: "vec3",
                },

                // Uniform bindings
                uniforms: {
                    normalMat: "mat4",
                    pvm: "mat4",
                    uColor: "vec3",
                    uCameraPos: "vec3",
                    uMinFade: "float",
                    uMaxFade: "float",
                    // uTime: "float",
                },
            }),
        },
        models: "example/models.json",
    })
    .then(() => engine.loadScene(state, TestScene))
    .then(() => engine.run(state));
