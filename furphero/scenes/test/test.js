class TestScene extends Scene {

    // Variables for scene
    cube = null;
    time = 0.0;
    pvm = null; 

    constructor() {
        super()
    }

    async init(state) {
        // Load scene data from json
        await this.load(state, "furphero/scenes/test/test.json")

        // Aquire nodes so we don't hash on every update
        this.cube = this.get("cube");
        mat4.translate(this.cube.transform, this.cube.transform, [0.0,0.0,-4.0]);

        // Aquire uniform objects from the GPUState so we can update them
        this.pvm = state.getUniform("default", "pvm");
        this.pvm.set(mat4.create());

    }

    update(delta) {

        this.time += delta;

        mat4.translate(this.cube.transform, this.cube.transform, [0.0, Math.sin(this.time/1000.0)*0.001, 0.0]);
        mat4.rotateX(this.cube.transform, this.cube.transform, Math.sin(this.time/5000.0)*0.001*(360*Math.PI/180.0));
        mat4.rotateY(this.cube.transform, this.cube.transform, Math.sin(this.time/5000.0)*0.001*(360*Math.PI/180.0));

        return FLOW.RENDER;
    }

    render(state) {

        // Here any pre-rendering or scene-global uniforms can be updated

        this.nodes.forEach(node => {

            // Set and update node uniforms to GPU 
            // Here specifically we're using the GPUState's camera to make a pvm value
            state.camera.calcPVM(this.pvm.value, node.transform);
            this.pvm.update();

            // Render nodes 
            node.render();
        });
    }

}