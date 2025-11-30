
const state = new GPUState();
const engine = new Engine();
// Define rendering pipeline layout for GPU state
state.init({
    programs: {
        default: new Program({
            // Shader program source code
            source: "furphero/shaders/default",
            
            // Vertex attribute layout
            attributes: {
                aPosition: "vec3",
                aNormal: "vec3",
            },

            // Uniform bindings 
            uniforms: {
                pvm: "mat4",
                uColor: "vec3",
                uCameraPos: "vec3",
            }
        }),

        simpletexture: new Program({
            // Shader program source code
            source: "furphero/shaders/simpletexture",
            
            // Vertex attribute layout
            attributes: {
                aPosition: "vec3",
                aUV: "vec2",
            },

            // Uniform bindings 
            uniforms: {
                pvm: "mat4",
                uTexture: "sampler2D",
                uCameraPos: "vec3",
            }
        }),

        myshader: new Program({
            // Shader program source code
            source: "furphero/shaders/myshader",
            
            // Vertex attribute layout
            attributes: {
                aPosition: "vec3",
                aUV: "vec2",
            },

            // Uniform bindings 
            uniforms: {
                pvm: "mat4",
                uTexture: "sampler2D",
                uCameraPos: "vec3",
            }
        }),
    },
    models: "furphero/models.json"
})
.then(() => engine.loadScene(state, TestScene))
.then(() => engine.run(state));