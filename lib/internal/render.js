/* DOM Constants */
const canvas = document.getElementById("glcanvas");
const urlCreator = window.URL || window.webkitURL;

/* GL Context Constants */
const gl = canvas.getContext("webgl2");
if (gl === null) {
    alert("WebGL 2 is not supported in your current browser.");
}

/* Global Definitions */

// Control Flow messages
const FLOW = {
    NONE: 0,
    RENDER: 1,
    CHANGE_SCENE: 2,
};

// Data types for GL
// The referenced functions will only be used for Uniforms
// since that's the only time WebGL needs to declare types
const DATA_TYPE = {
    vec3: "uniform3fv",
    vec2: "uniform2fv",
    float: "uniform1f",
    sampler2D: "uniform1i",
    mat4: "uniformMatrix4fv",
};

/* GL Helper Functions */

function loadShader(gl, type, source) {
    // Create a new shader object
    const shader = gl.createShader(type);

    // Send the source to the shader object
    gl.shaderSource(shader, source);

    // Compile the shader program
    gl.compileShader(shader);

    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        // Fail with an error message
        var typeStr = "";
        if (type === gl.VERTEX_SHADER) {
            typeStr = "VERTEX";
        } else if (type === gl.FRAGMENT_SHADER) {
            typeStr = "FRAGMENT";
        }
        console.error(
            "An error occurred compiling the shader: " + typeStr,
            gl.getShaderInfoLog(shader),
        );
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

/* DOM Helper functions */

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.addEventListener("load", () => resolve(img));
        img.addEventListener("error", (err) => reject(err));
        img.src = url;
    });
}

/* Classes */

// Uniform program smart pointer
class Uniform {
    value = null;
    fUpdate = null;
    location = null;
    program = null;
    constructor(program, fUpdate, uName) {
        this.fUpdate = fUpdate;
        this.program = program;
        this.location = gl.getUniformLocation(program, uName);
    }

    set(value) {
        this.value = value;
    }

    update() {
        gl.useProgram(this.program);
        if (this.fUpdate == DATA_TYPE.mat4) {
            gl[this.fUpdate](this.location, false, this.value);
        } else {
            gl[this.fUpdate](this.location, this.value);
        }
    }
}

class Program {
    program = null;
    uniforms = {};
    attributes = {};
    isReady = null;

    constructor(desc, vSrc, fSrc) {
        const sources = [
            desc.source + "/vertex.glsl",
            desc.source + "/fragment.glsl",
        ];

        this.isReady = Promise.all(
            sources.map((x) => fetch(x).then((r) => r.text())),
        ).then(([vSrc, fSrc]) => {
            // Init program
            this.program = gl.createProgram();

            // Use our custom function to load and compile the shader objects
            const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vSrc);
            const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fSrc);

            // Compile, attach, and link
            gl.attachShader(this.program, vertexShader);
            gl.attachShader(this.program, fragmentShader);
            gl.linkProgram(this.program);

            // Check link status
            if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
                console.log(
                    "Unable to link the shader program" +
                        gl.getProgramInfoLog(this.program),
                );
                return null;
            }

            // Init uniform locations
            for (const uKey in desc.uniforms) {
                this.uniforms[uKey] = new Uniform(
                    this.program,
                    DATA_TYPE[desc.uniforms[uKey]],
                    uKey,
                );
                if (this.uniforms[uKey].location === -1) {
                    console.error(
                        "Uniform location for '" +
                            uKey +
                            "' could not be found!",
                    );
                }
            }

            // Init attribute locations
            for (let aKey in desc.attributes) {
                this.attributes[aKey] = {
                    location: gl.getAttribLocation(this.program, aKey),
                    data_type: desc.attributes[aKey],
                };
                if (this.attributes[aKey] === -1) {
                    console.error(
                        "Attribute location for '" +
                            aKey +
                            "' could not be found!",
                    );
                }
            }
        });
    }

    // This creates the VAO and it's buffers
    createVAO(attribArrays) {
        const buffers = {};

        // Init VAO
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        // Create each attribute buffer for the VAO
        for (let aKey in attribArrays) {
            let array = new Float32Array(attribArrays[aKey].flat());
            if (array == null || array.length <= 0) {
                console.error(
                    "Cannot create buffer for '" +
                        aKey +
                        "' from empty object or array!",
                );
                return null;
            }

            // Create and bind buffer
            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

            // Write array to buffer
            gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);

            let f = (type) => {
                switch (DATA_TYPE[type]) {
                    case DATA_TYPE.vec3:
                        return [3, gl.FLOAT];
                    case DATA_TYPE.vec2:
                        return [2, gl.FLOAT];
                    default:
                        return [1];
                }
            };

            // Set attribute pointer for buffer and enable
            let tmp = f(this.attributes[aKey].data_type);
            const numComponents = tmp[0];
            const type = tmp[1];
            const normalize = false;
            const stride = 0;
            const offset = 0;

            gl.vertexAttribPointer(
                this.attributes[aKey].location,
                numComponents,
                type,
                normalize,
                stride,
                offset,
            );

            gl.enableVertexAttribArray(this.attributes[aKey].location);

            buffers[aKey] = buffer;
        }

        return { vao, buffers };
    }
}

class GPUState {
    framerate = 1000.0 / 60.0;
    framebuffer = null; // Default to canvas framebuffer
    camera = new Camera(canvas.clientWidth, canvas.clientHeight);
    programs = {};
    textures = [];
    textures_map = [];
    framebuffers = {
        canvas: {
            fb: null,
            texture: null,
        },
    };
    models = {};

    constructor() {}

    getFramebuffer(name) {
        return this.framebuffer[name];
    }

    selectFramebuffer(fbo) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.fb);
    }

    createTexture(targetTextureWidth, targetTextureHeight) {
        const targetTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, targetTexture);

        const level = 0;
        const internalFormat = gl.RGBA;
        const border = 0;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;
        const data = null;

        gl.texImage2D(
            gl.TEXTURE_2D,
            level,
            internalFormat,
            targetTextureWidth,
            targetTextureHeight,
            border,
            format,
            type,
            data,
        );

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        return targetTexture;
    }

    createFramebuffer(name, targetTextureWidth, targetTextureHeight) {
        let targetTexture = this.createTexture(
            targetTextureWidth,
            targetTextureHeight,
        );
        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

        const attachmentPoint = gl.COLOR_ATTACHMENT0;
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            attachmentPoint,
            gl.TEXTURE_2D,
            targetTexture,
            level,
        );

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        this.framebuffers[name] = { fb, texture };
    }

    getModel(modelName) {
        return this.models[modelName];
    }

    getUniform(programName, uniformName) {
        return this.programs[programName].uniforms[uniformName];
    }

    setFps(fps) {
        this.framerate = 1000.0 / fps;
    }

    render(scene) {
        // Clear screen
        gl.clearColor(0.5, 0.7, 1.0, 1.0);

        // GL parameters
        gl.depthFunc(gl.LEQUAL);
        gl.clearDepth(1.0);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // TODO: Pre-render setup stuff
        // this.updateUniforms();

        // Render scene
        // TODO: multiple or nested scenes?
        scene.render(this);
    }

    async init(desc) {
        this.pTime = 0;
        this.programs = desc.programs;
        this.models = {};

        // Wait for each shader program to compile and link
        for (let pKey in this.programs) {
            await this.programs[pKey].isReady;
        }

        // Load models against loaded programs
        let models = await fetch(desc.models).then((x) => x.json());
        for (let mKey in models) {
            let model = models[mKey];

            // Create new index buffer
            const indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(
                gl.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(model.indices.flat()),
                gl.STATIC_DRAW,
            );

            let program = this.programs[model.program];

            const vaoInfo = program.createVAO(model.attribArrays);

            // Load texture
            let texture = null;
            if ("texture" in model) {
                let textureImage = await loadImage(model.texture);

                // Create and write to texture on GPU
                texture = this.createTexture(
                    textureImage.width,
                    textureImage.height,
                );
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    textureImage,
                );
                gl.bindTexture(gl.TEXTURE_2D, null);
            }

            // Store buffer pointers in state
            this.models[mKey] = {
                vaoInfo,
                indexBuffer,
                numVertices: model.indices.length,
                program,
                texture,
            };
        }

        // GL Settings
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        // gl.frontFace(gl.CW);
    }
}
