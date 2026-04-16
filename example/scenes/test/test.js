class TestScene extends Scene {
    // Variables for scene
    cubes = [];
    time = 0.0;
    pvm = null;
    cameraPos = null;
    color = null;

    action = "Stay";
    cameraAction = "Spin";
    jumptime = 0.0;
    prevAction = "Stay";

    // Separate entities
    uiCamera = null;
    minFade = null;
    maxFade = null;

    constructor() {
        super();

        this.action = "Stay";
        this.cameraAction = "Spin";
        this.prevAction = "Stay";
        this.jumptime = 0.0;
        this.uiCamera = new Camera(
            state.camera.screen.width,
            state.camera.screen.height,
        );

        window.addEventListener("keydown", (e) => {});
    }

    // Scene Functions
    async init(state) {
        // Load scene data from json
        await this.load(state, "example/scenes/test/test.json");

        state.camera.rotateY(-180.0, 3.0);
        state.camera.position[1] = 3.0;
        // state.camera.position[2] = -4.0;
        state.camera.update();

        // Aquire nodes so we don't hash on every update
        let cube0 = this.get("cube");

        // Get existing cube
        cube0.baseTransform = mat4.clone(cube0.transform);

        this.minFade = state.getUniform("simplecolor", "uMinFade");
        this.maxFade = state.getUniform("simplecolor", "uMaxFade");

        this.cubes.push(cube0);

        // Aquire uniform objects from the GPUState so we can update them
        this.pvm = state.getUniform("simplecolor", "pvm");
        this.pvm.set(mat4.create());

        this.normalMat = state.getUniform("simplecolor", "normalMat");
        this.normalMat.set(mat4.create());

        this.cameraPos = state.getUniform("simplecolor", "uCameraPos");
        this.color = state.getUniform("simplecolor", "uColor");

        // this.timeUniform = state.getUniform("simplecolor", "uTime");
        // this.timeUniform.set(this.time);
        // this.timeUniform.update();
    }

    update(delta) {
        // this.time += delta;
        // this.timeUniform.set(this.time);
        // this.timeUniform.update();

        state.camera.update();

        this.cameraPos.set(state.camera.position);

        return FLOW.RENDER;
    }

    render(state) {
        // Here any pre-rendering or scene-global uniforms can be updated

        gl.enable(gl.DEPTH_TEST);
        // gl.colorMask(true,true,true,false);
        this.minFade.set(10.0);
        this.maxFade.set(20.0);
        this.minFade.update();
        this.maxFade.update();

        this.nodes.forEach((node) => {
            // Set and update node uniforms to GPU
            // Here specifically we're using the GPUState's camera to make a pvm value
            let normalMat = mat4.create();
            mat4.invert(normalMat, node.transform); // poor mat is being inverted
            mat4.transpose(normalMat, normalMat);
            this.normalMat.set(normalMat);
            this.normalMat.update();

            state.camera.calcPVM(this.pvm.value, node.transform);
            this.pvm.update();
            this.cameraPos.update();

            this.color.set(node.data.color);
            this.color.update();

            // Render nodes
            node.render();
        });
    }
}
