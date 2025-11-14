
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
            },

            // Uniform bindings 
            uniforms: {
                pvm: "mat4",
                uColor: "vec3",
            }
        }),
    },
    models: "furphero/models.json"
})
.then(() => engine.loadScene(state, TestScene))
.then(() => engine.run(state));