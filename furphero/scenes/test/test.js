class TestScene extends Scene {
    // Variables for scene
    cubes = [];
    notes = [];
    noteSpeed = 0.01;
    time = 0.0;
    pvm = null;
    cameraPos = null;
    song = null;

    action = "Stay";
    cameraAction = "Spin";
    jumptime = 0.0;
    prevAction = "Stay";

    // Separate entities
    track = null;
    tracks = [];
    stage = null;
    note = null;

    uiCamera = null;
    minFade = null;
    maxFade = null;

    constructor() {
        super();


        this.song = new SongHost("ac");

        this.action = "Stay";
        this.cameraAction = "Spin";
        this.prevAction = "Stay";
        this.jumptime = 0.0;
        this.uiCamera = new Camera(
            state.camera.screen.width,
            state.camera.screen.height
        );

        window.addEventListener("keydown", (e) => {
            if (e.code === "ArrowUp") {
                this.action = "Shake";
            }
            if (e.code === "ArrowDown") {
                this.action = "Spin";
            }
            if (e.code === "ArrowLeft") {
                this.action = "Jump";
                this.jumptime = this.time;
            }
            if (e.code === "ArrowRight") {
                this.action = "Wave";
            }
            if (e.code === "Space") {
                this.action = "Stay";
            }
            if (e.code === "KeyC") {
                if (this.cameraAction === "Spin") {
                    this.cameraAction = "Stay";
                } else {
                    this.cameraAction = "Spin";
                }
            }
            if (e.code === "KeyA") {
                this.spawnNote(0);
            }
            if (e.code === "KeyS") {
                this.spawnNote(1);
            }
            if (e.code === "KeyD") {
                this.spawnNote(2);
            }
            if (e.code === "KeyF") {
                this.spawnNote(3);
            }

        });
    }

    // Game functions
    updateAudio(delta) {}

    // Scene Functions
    async init(state) {
        // Load scene data from json
        await this.load(state, "furphero/scenes/test/test.json");
        await this.song.load();
        this.song.play();

        state.camera.rotateY(-180.0, 3.0);
        state.camera.position[1] = 3.0;
        // state.camera.position[2] = -4.0;
        state.camera.update();

        // Aquire nodes so we don't hash on every update
        this.stage = this.get("stage");
        this.note = this.get("note");

        let cube0 = this.get("cube");

        // Get existing cube
        cube0.baseTransform = mat4.clone(cube0.transform);

        this.track = this.get("track");
        this.tracks = [
            this.track.get("track1"),
            this.track.get("track2"),
            this.track.get("track3"),
            this.track.get("track4"),
        ];

        this.spawnNote(0);
        this.spawnNote(1);
        this.spawnNote(2);
        this.spawnNote(3);

        this.minFade = state.getUniform("simpletexture", "uMinFade");
        this.maxFade = state.getUniform("simpletexture", "uMaxFade");

        // Duplicate cube node into multiple instances
        let spread = 1.0;
        let base_spread = 3.5;
        let crowd_density = 30;
        let crowd_size = 10;
        let ypos = -1.0;
        for (let j = 0; j < crowd_size; j++) {
            for (let i = 0; i < crowd_density; i++) {
                let curl = Math.random();
                let rad = (((i * 0.7 + curl) / 10.0) * 360.0 * Math.PI) / 180.0;
                let newcube = this.cloneAs("cube" + i + ":" + j, cube0);
                if (newcube != null) {
                    newcube.transform = mat4.clone(newcube.transform);
                    mat4.scale(
                        newcube.transform,
                        newcube.transform,
                        [0.5, 0.5, 0.5]
                    );
                    mat4.translate(newcube.transform, newcube.transform, [
                        Math.cos(rad) * (base_spread + spread * j),
                        ypos,
                        Math.sin(rad) * (base_spread + spread * j),
                    ]);
                    mat4.rotateY(
                        newcube.transform,
                        newcube.transform,
                        -(rad + (Math.PI * 90) / 180)
                    );
                    newcube.baseTransform = mat4.clone(newcube.transform);
                    this.cubes.push(newcube);
                }
            }
        }
        this.cubes.push(cube0);

        // Aquire uniform objects from the GPUState so we can update them
        this.pvm = state.getUniform("simpletexture", "pvm");
        this.pvm.set(mat4.create());

        this.normalMat = state.getUniform("simpletexture", "normalMat");
        this.normalMat.set(mat4.create());

        this.cameraPos = state.getUniform("simpletexture", "uCameraPos");
        let textureSampler = state.getUniform("simpletexture", "uTexture");
        textureSampler.set(0);
        textureSampler.update();
    }

    update(delta) {
        this.time += delta;
        if (this.action !== this.prevAction) {
            this.cubes.forEach((cube) => {
                if (!cube || !cube.baseTransform) return;
                mat4.copy(cube.transform, cube.baseTransform);
            });
            if (this.action === "Jump") {
                this.jumptime = this.time;
            }
            this.prevAction = this.action;
        }

        let noteSpeed = this.noteSpeed;
        this.notes.forEach((note) => {
            mat4.translate(note.transform, note.transform, [0.0,0.1*delta*noteSpeed,0.0]);
        });

        this.cubes.forEach((cube) => {
            // Shake what yo mama gave ya
            if (this.action === "Shake") {
                mat4.rotateY(
                    cube.transform,
                    cube.transform,
                    Math.sin(this.time / 100.0) *
                        0.01 *
                        ((360 * Math.PI) / 180.0)
                );
            }
            // Spin me right round baby right round
            if (this.action === "Spin") {
                mat4.rotateY(
                    cube.transform,
                    cube.transform,
                    0.02 * ((360 * Math.PI) / 180.0)
                );
            }
            // Jump up jump up and get down
            if (this.action === "Jump") {
                mat4.copy(cube.transform, cube.baseTransform);

                const elaped = this.time - this.jumptime;
                const period = 700.0;

                const phase = (elaped / period) * 2.0 * Math.PI;
                const bounce = (Math.sin(phase) + 1.0) * 0.5 * 0.6;
                mat4.translate(cube.transform, cube.transform, [
                    0.0,
                    bounce,
                    0.0,
                ]);
            }

            // Wave back and forth
            if (this.action === "Wave") {
                mat4.copy(cube.transform, cube.baseTransform);

                const tilt =
                    Math.sin(this.time / 200.0) * ((10 * Math.PI) / 180.0);

                mat4.rotateZ(cube.transform, cube.transform, tilt);
            }
            // Stop collaborate and listen
            if (this.action === "Stay") {
                mat4.copy(cube.transform, cube.baseTransform);
            }
        });

        // Rotate camera around scene
        if (this.cameraAction === "Spin") {
            state.camera.rotateY((this.time / 7000.0) * 360.0, 2.0);
        }
        // Top down view
        else {
            state.camera.rotateY(90, 3);
        }
        state.camera.update();

        this.cameraPos.set(state.camera.position);

        return FLOW.RENDER;
    }

    render(state) {
        // Here any pre-rendering or scene-global uniforms can be updated

        let mat = mat4.create();
        let normalMat = mat4.create();
        mat4.invert(normalMat, mat);
        mat4.transpose(normalMat, normalMat);

        this.normalMat.set(normalMat);
        this.normalMat.update();

        gl.enable(gl.DEPTH_TEST);
        // gl.colorMask(true,true,true,false);
        this.minFade.set(10.0);
        this.maxFade.set(20.0);
        this.minFade.update();
        this.maxFade.update();

        this.cubes.forEach((node) => {
            // Set and update node uniforms to GPU
            // Here specifically we're using the GPUState's camera to make a pvm value
            state.camera.calcPVM(this.pvm.value, node.transform);
            this.pvm.update();
            this.cameraPos.update();

            // Render nodes
            node.render();
        });

        // Render stage
        let node = this.stage;
        state.camera.calcPVM(this.pvm.value, node.transform);
        this.pvm.update();
        this.cameraPos.update();

        node.render();

        // Render track
        gl.disable(gl.DEPTH_TEST);
        this.minFade.set(1.0);
        this.maxFade.set(3.8);
        this.minFade.update();
        this.maxFade.update();
        this.renderChildren(this.uiCamera, this.track, this.track.transform);
    }

    renderChildren(camera, parent, parent_mat) {
        for(let i in parent.nodes) {

            let node = parent.nodes[i];
            let mat = mat4.create();
            mat4.multiply(mat, parent_mat, node.transform);
    
            // Set and update node uniforms to GPU
            // Here specifically we're using the GPUState's camera to make a pvm value
            camera.calcPVM(this.pvm.value, mat);
            this.pvm.update();
            this.cameraPos.update();
    
            node.render();
            this.renderChildren(camera,node,mat);
        }
    }

    spawnNote(trackNum) {
        let notename = "note"+this.notes.length;
        let note = this.cloneAs(notename, this.note);
        this.notes.push(note);
        note.transform = mat4.clone(note.transform);
        this.tracks[trackNum].add(notename,note);
    }

    //TODO: Despawn notes
    
}
