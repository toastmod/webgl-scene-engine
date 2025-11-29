class TestScene extends Scene {

    // Variables for scene
    cubes = [];
    time = 0.0;
    pvm = null; 
    cameraPos = null;

    constructor() {
        super()
    }

    async init(state) {
        // Load scene data from json
        await this.load(state, "furphero/scenes/test/test.json")

        // Aquire nodes so we don't hash on every update
        // Get existing cube 
        let cube0 = this.get("cube");
        mat4.translate(cube0.transform, cube0.transform, [0.0,0.0,-8.0]);

        // Duplicate cube node into multiple instances
        for(let i=0; i<20; i++) {
            let rad = (((i/20.0)*360.0)*Math.PI)/180.0
            let newcube = this.cloneAs("cube"+i, cube0);
            if(newcube != null) {
                newcube.transform = mat4.clone(newcube.transform);
                mat4.translate(newcube.transform, newcube.transform, [Math.cos(rad)*2.0, Math.sin(rad)*2.0,Math.sin(rad)*2.0]);
            }
            this.cubes.push(newcube);
        }
        this.cubes.push(cube0);

        // Aquire uniform objects from the GPUState so we can update them
        this.pvm = state.getUniform("default", "pvm");
        this.pvm.set(mat4.create());

        this.cameraPos = state.getUniform("default", "uCameraPos");

    }

    update(delta) {

        this.time += delta;

        this.cubes.forEach((cube) =>{
            // mat4.translate(cube.transform, cube.transform, [0.0, Math.sin(this.time/1000.0)*0.001, 0.0]);
            mat4.rotateX(cube.transform, cube.transform, Math.sin(this.time/2000.0)*0.001*(360*Math.PI/180.0));
            mat4.rotateY(cube.transform, cube.transform, Math.sin(this.time/5000.0)*0.001*(360*Math.PI/180.0));
        });

        this.cameraPos.set(state.camera.position);

        return FLOW.RENDER;
    }

    render(state) {

        // Here any pre-rendering or scene-global uniforms can be updated

        this.nodes.forEach(node => {

            // Set and update node uniforms to GPU 
            // Here specifically we're using the GPUState's camera to make a pvm value
            state.camera.calcPVM(this.pvm.value, node.transform);
            this.pvm.update();
            this.cameraPos.update();

            // Render nodes 
            node.render();
        });
    }

}