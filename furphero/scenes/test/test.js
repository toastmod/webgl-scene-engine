class TestScene extends Scene {
    // Variables for scene
    cubes = [];
    notes = [];
    noteId = 0;
    score = 0;
    hitY = -1;
    hitWindow = 0.15;
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
            if (e.code === "KeyQ") {
                this.action = "Shake";
            }
            if (e.code === "KeyW") {
                this.action = "Spin";
            }
            if (e.code === "KeyE") {
                this.action = "Jump";
                this.jumptime = this.time;
            }
            if (e.code === "KeyR") {
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
                // this.spawnNote(0);
            }
            if (e.code === "KeyS") {
                // this.spawnNote(1);
            }
            if (e.code === "KeyD") {
                // this.spawnNote(2);
            }
            if (e.code === "KeyF") {
                // this.spawnNote(3);
            }
            // Check when the player hits a key
            const lane = this.keyToLane(e.code);
            if (lane !== -1) {
                this.tryHit(lane);
            }
        });
    }

    // Game functions
    updateAudio(delta) {}

    // Scene Functions
    async init(state) {
        // Load scene data from json
        await this.load(state, "furphero/scenes/test/test.json");
        await this.song.load(this);
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

        this.scoreElement = document.getElementById("scoreText");
        this.scoreElement.innerText = "Score: " + this.score;

        this.timeUniform = state.getUniform("simpletexture", "uTime");
        this.timeUniform.set(this.time);
        this.timeUniform.update();
    }

    update(delta) {
        this.time += delta;
        this.timeUniform.set(this.time);
        this.timeUniform.update();
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
            mat4.translate(note.note.transform, note.note.transform, [
                0.0,
                0.1 * delta * noteSpeed,
                0.0,
            ]);
        });
        this.notes = this.notes.filter(n => {
            if (!n.hit) return true;
            this.tracks[n.lane].remove(n.notename);
            return false;
        })

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

        gl.enable(gl.DEPTH_TEST);
        // gl.colorMask(true,true,true,false);
        this.minFade.set(10.0);
        this.maxFade.set(20.0);
        this.minFade.update();
        this.maxFade.update();

        this.cubes.forEach((node) => {
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

            // Render nodes
            node.render();
        });

        // Render stage
        let node = this.stage;
        let normalMat = mat4.create();
        mat4.invert(normalMat, node.transform); // poor mat is being inverted
        mat4.transpose(normalMat, normalMat);
        this.normalMat.set(normalMat);
        this.normalMat.update();

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
        for (let i in parent.nodes) {
            let node = parent.nodes[i];
            let mat = mat4.create();
            mat4.multiply(mat, parent_mat, node.transform);

            let normalMat = mat4.create();
            mat4.invert(normalMat, mat); // poor mat is being inverted
            mat4.transpose(normalMat, normalMat);
            this.normalMat.set(normalMat);
            this.normalMat.update();

            // Set and update node uniforms to GPU
            // Here specifically we're using the GPUState's camera to make a pvm value
            camera.calcPVM(this.pvm.value, mat);
            this.pvm.update();
            this.cameraPos.update();

            node.render();
            this.renderChildren(camera, node, mat);
        }
    }

    spawnNote(trackNum) {
        let notename = "note" + this.noteId++;
        let note = this.cloneAs(notename, this.note);
        note.transform = mat4.clone(note.transform);
        this.tracks[trackNum].add(notename, note);
        this.notes.push({ note, notename, lane: trackNum, hit: false });
    }

    tryHit(lane) {
        // Store best candidate note (null if no hit note)
        let best = null;
        let bestDist = this.hitWindow;

        for (const n of this.notes) {
            // Skip notes in wrong lane or already hit
            if (n.lane !== lane || n.hit) continue;

            // Check distance to hit line
            const y = n.note.transform[13];
            const dist = Math.abs(y - this.hitY);

            // See if note is the best candidate
            if (dist < bestDist) {
                best = n;
                bestDist = dist;
            }
        }
    }

    renderChildren(camera, parent, parent_mat) {
        for (let i in parent.nodes) {
            let node = parent.nodes[i];
            let mat = mat4.create();
            mat4.multiply(mat, parent_mat, node.transform);

            let normalMat = mat4.create();
            mat4.invert(normalMat, mat); // poor mat is being inverted
            mat4.transpose(normalMat, normalMat);
            this.normalMat.set(normalMat);
            this.normalMat.update();

            // Set and update node uniforms to GPU
            // Here specifically we're using the GPUState's camera to make a pvm value
            camera.calcPVM(this.pvm.value, mat);
            this.pvm.update();
            this.cameraPos.update();

            node.render();
            this.renderChildren(camera, node, mat);
        }
    }

    spawnNote(trackNum, midiEvent) {
        let notename = "note" + this.noteId++;
        let note = this.cloneAs(notename, this.note);
        note.transform = mat4.clone(note.transform);
        this.tracks[trackNum].add(notename, note);
        this.notes.push({ note, notename, lane: trackNum, hit: false, midiEvent });
    }

    tryHit(lane) {
        // Store best candidate note (null if no hit note)
        let best = null;
        let bestDist = this.hitWindow;

        for (const n of this.notes) {
            // Skip notes in wrong lane or already hit
            if (n.lane !== lane || n.hit) continue;

            // Check distance to hit line
            const y = n.note.transform[13];
            const dist = Math.abs(y - this.hitY);

            // See if note is the best candidate
            if (dist < bestDist) {
                best = n;
                bestDist = dist;
            }
        }

        // If a note is hit
        if (best) {
            // Mark note as hit and update score
            best.hit = true;
            this.score += 1;
            // Update score display
            this.scoreElement.innerText = "Score: " + this.score;
        }
    }

    keyToLane(code) {
        switch (code) {
            case "KeyQ":
                return 0;
            case "KeyW":
                return 1;
            case "KeyE":
                return 2;
            case "KeyR":
                return 3;
            default:
                return -1;
        }
    }

    //TODO: Despawn notes
}
