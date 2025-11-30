class TestScene extends Scene {
  // Variables for scene
  cubes = [];
  lights = [];
  time = 0.0;
  pvm = null;
  normalMat = null;
  cameraPos = null;
  textureSampler = null;

  constructor() {
    super();
  }

  async init(state) {
    // Load scene data from json
    await this.load(state, "furphero/scenes/test/test.json");

    state.camera.rotateY(-180.0, 3.0);
    state.camera.position[1] = 3.0;
    // state.camera.position[2] = -4.0;
    state.camera.update();

    // Aquire nodes so we don't hash on every update
    // Get existing cube
    let cube0 = this.get("cube");
    this.lights = this.get("lights");
    // mat4.scale(cube0.transform, cube0.transform, [0.9,0.9,0.9]);
    // mat4.translate(cube0.transform, cube0.transform, [0.0,0.0,0.0]);

    // Duplicate cube node into multiple instances
    for (let i = 0; i < 20; i++) {
      let rad = ((i / 20.0) * 360.0 * Math.PI) / 180.0;
      let newcube = this.cloneAs("cube" + i, cube0);
      if (newcube != null) {
        newcube.transform = mat4.clone(newcube.transform);
        mat4.translate(newcube.transform, newcube.transform, [
          Math.cos(rad) * 2.0,
          Math.sin(rad) * 2.0,
          Math.sin(rad) * 2.0,
        ]);
      }
      this.cubes.push(newcube);
    }
    this.cubes.push(cube0);

    // Aquire uniform objects from the GPUState so we can update them
    this.pvm = state.getUniform("simpletexture", "pvm");
    this.pvm.set(mat4.create());
    this.normalMat = state.getUniform("simpletexture", "normalMat");
    this.normalMat.set(mat4.create());

    this.cameraPos = state.getUniform("simpletexture", "uCameraPos");
    this.textureSampler = state.getUniform("simpletexture", "uTexture");
    this.textureSampler.set(0);
    this.textureSampler.update();
  }

  update(delta) {
    this.time += delta;

<<<<<<< HEAD
    this.cubes.forEach((cube) => {
      // mat4.translate(cube.transform, cube.transform, [0.0, Math.sin(this.time/1000.0)*0.001, 0.0]);
      // mat4.rotateX(cube.transform, cube.transform, Math.sin(this.time/2000.0)*0.001*(360*Math.PI/180.0));
      // mat4.translate(cube.transform, cube.transform, [0.0,0.0,1.0]);
      // mat4.rotateY(cube.transform, cube.transform, Math.sin(this.time/100.0)*0.01*(360*Math.PI/180.0));
      // mat4.translate(cube.transform, cube.transform, [0.0,0.0,-1.0]);
    });
    state.camera.rotateY((this.time / 7000.0) * 360.0, 2.0);
    state.camera.update();
=======
        // Duplicate cube node into multiple instances
        let spread = 1.0;
        let base_spread = 3.5;
        let crowd_density = 30;
        let crowd_size = 10;
        for(let j=0; j<crowd_size; j++) {
            for(let i=0; i<crowd_density; i++) {
                let curl = Math.random();
                let rad = (((((i*0.7)+curl)/10.0)*360.0)*Math.PI)/180.0
                let newcube = this.cloneAs("cube"+i+":"+j, cube0);
                if(newcube != null) {
                    newcube.transform = mat4.clone(newcube.transform);
                    mat4.scale(newcube.transform, newcube.transform, [0.5, 0.5, 0.5]);
                    mat4.translate(newcube.transform, newcube.transform, [Math.cos(rad)*(base_spread+(spread*j)), -0.5, Math.sin(rad)*(base_spread+(spread*j))]);
                    mat4.rotateY(newcube.transform, newcube.transform, -(rad+(Math.PI*90/180)));
                }
                this.cubes.push(newcube);
            }
        }
        this.cubes.push(cube0);
>>>>>>> 32366ed2fdecbaac1759088e06a0612fe7a8b872

    this.cameraPos.set(state.camera.position);

    return FLOW.RENDER;
  }

  render(state) {
    // Here any pre-rendering or scene-global uniforms can be updated

    this.nodes.forEach((node) => {
      // Set and update node uniforms to GPU
      // Here specifically we're using the GPUState's camera to make a pvm value
      state.camera.calcPVM(this.pvm.value, node.transform);
      this.pvm.update();

      let normalMat = mat4.create();
      mat4.invert(normalMat, node.transform);
      mat4.transpose(normalMat, normalMat);

      this.normalMat.set(normalMat);
      this.normalMat.update();
      // console.log(normalMat);

      this.cameraPos.update();

      // Render nodes
      node.render();
    });
  }
}
