const reader = new FileReader();

var AudioContextFunc = window.AudioContext || window.webkitAudioContext;
var audioContext = new AudioContextFunc();

class SongHost {
    path = "";
    midiplayer = null;
    track_map = {};
    tracks = [];
    sf = null;
    midiplayer = null;

    constructor(songName) {
        this.path = "./furphero/res/midi/" + songName + "/song";
    }

    async load() {
        // Load a MIDI file
        const midi = await fetch(this.path + ".mid").then((x) => x.blob());

        const data = await fetch(this.path + ".json").then((x) => x.json());

        for (let key in data) {
            let track = Number(key);
            let instrument = data[key].split(".");

            if (instrument[0] == "presets") {
                // Handle preset
                this.track_map[track] = this.tracks.length;
                this.tracks.push(new Wad(Wad.presets[instrument[1]]));
            } else {
                this.track_map[track] = this.tracks.length;
                this.tracks.push(
                    new Wad({
                        source: data[key],
                    })
                );
            }
        }

        const tracks = this.tracks;
        const track_map = this.track_map;
        this.midiplayer = new MidiPlayer.Player(function (event) {
            if (event.noteName != undefined && event.track in track_map) {
                let voice = tracks[track_map[event.track]];
                let noteLength = 70;
                if (event.name == "Note on") {
                    voice.play({
                        pitch: event.noteName,
                        label: event.noteName,
                    });
                } else if (event.name == "Note off") {
                    voice.stop(event.noteName);
                }
                console.log(event);
            }
        });

        this.midiplayer.loadDataUri(
            await new Promise((resolve, reject) => {
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(midi);
            })
        );
    }

    play() {
        this.midiplayer.play();
    }
}

class TestScene extends Scene {
    // Variables for scene
    cubes = [];
    time = 0.0;
    pvm = null;
    cameraPos = null;
    song = null;

    action = "Stay";
    cameraAction = "Spin";
    jumptime = 0.0;
    prevAction = "Stay";

    // Separate entities
    track = [];
    stage = null;

    uiCamera = null;
    minFade = null;
    maxFade = null;

    constructor() {
        super();

        this.song = new SongHost("tetris");

        this.action = "Stay";
        this.cameraAction = "Spin";
        this.prevAction = "Stay";
        this.jumptime = 0.0;
        this.uiCamera = new Camera(state.camera.screen.width, state.camera.screen.height);

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

        // Get existing cube
        let cube0 = this.get("cube");
        cube0.baseTransform = mat4.clone(cube0.transform);
        // mat4.scale(cube0.transform, cube0.transform, [0.9,0.9,0.9]);
        // mat4.translate(cube0.transform, cube0.transform, [0.0,0.0,0.0]);

        let basetrack = this.get("track");
        if (basetrack) {
            this.track.push(basetrack);

            for (let i = 1; i < 4; i++) {
                const clone = this.cloneAs("track:" + i, basetrack);
                if (clone) {
                    this.track.push(clone);
                }
            }
        }

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
            state.camera.calcPVM(this.pvm.value, node.transform);
            this.pvm.update();
            this.cameraPos.update();

            let normalMat = mat4.create();
            mat4.invert(normalMat, node.transform);
            mat4.transpose(normalMat, normalMat);

            this.normalMat.set(normalMat);
            this.normalMat.update();

            // Render nodes
            node.render();
        });

        // Render stage
        let node = this.stage;
        state.camera.calcPVM(this.pvm.value, node.transform);
        this.pvm.update();
        this.cameraPos.update();

        let normalMat = mat4.create();
        mat4.invert(normalMat, node.transform);
        mat4.transpose(normalMat, normalMat);

        this.normalMat.set(normalMat);
        this.normalMat.update();

        node.render();

        // Render track
        gl.disable(gl.DEPTH_TEST);
        this.minFade.set(0.5);
        this.maxFade.set(4.5);
        this.minFade.update();
        this.maxFade.update();
        this.track.forEach((node) => {
            // Set and update node uniforms to GPU
            // Here specifically we're using the GPUState's camera to make a pvm value
            this.uiCamera.calcPVM(this.pvm.value, node.transform);
            this.pvm.update();
            this.cameraPos.update();

            let normalMat = mat4.create();
            mat4.invert(normalMat, node.transform);
            mat4.transpose(normalMat, normalMat);

            this.normalMat.set(normalMat);
            this.normalMat.update();

            // Render nodes
            node.render();
        });
    }
}
