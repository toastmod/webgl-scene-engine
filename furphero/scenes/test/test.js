const reader = new FileReader();

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

class SongHost {
  path = "";
  midiplayer = null;
  constructor(songName) {
    this.path = "./furphero/res/midi/" + songName + "/song";
  }

  async load() {
    // Load a MIDI file
    const midi = await fetch("./furphero/res/midi/tetris/song.mid").then((x) =>
      x.blob(),
    );

    this.midiplayer.loadDataUri(
      await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(midi);
      }),
    );

    const data = await fetch(this.path + ".json").then((x) => x.json());
    data["instruments"];
    this.midiplayer = new MidiPlayer.Player(function (event) {
      if (event.noteName != undefined) {
        let label = crypto.randomUUID();
      }
    });
  }

  // play() {
  //   this.midiplayer.play();
  // }
}

class TestScene extends Scene {
  // Variables for scene
  cubes = [];
  notes = [];
  time = 0.0;
  pvm = null;
  cameraPos = null;
  textureSampler = null;
  sine = null;
  saw = null;

  action = "Stay";
  jumptime = 0.0;
  prevAction = "Stay";

  constructor() {
    super();

    this.saw = new Wad(Wad.presets.piano);
    this.sine = new Wad({ source: "sine" });
    this.sine = new Wad({ source: "sine" });

    const saw = this.saw;
    const sine = this.sine;

    this.action = "Stay";
    this.prevAction = "Stay";
    this.jumptime = 0.0;

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
    });
  }

  // Game functions
  updateAudio(delta) {}

  // Scene Functions
  async init(state) {
    // this.midiplayer.play();

    // Load scene data from json
    await this.load(state, "furphero/scenes/test/test.json");

    state.camera.rotateY(-180.0, 3.0);
    state.camera.position[1] = 3.0;
    // state.camera.position[2] = -4.0;
    state.camera.update();

    // Aquire nodes so we don't hash on every update
    // Get existing cube
    let cube0 = this.get("cube");
    cube0.baseTransform = mat4.clone(cube0.transform);
    // mat4.scale(cube0.transform, cube0.transform, [0.9,0.9,0.9]);
    // mat4.translate(cube0.transform, cube0.transform, [0.0,0.0,0.0]);

    // Duplicate cube node into multiple instances
    let spread = 1.0;
    let base_spread = 3.5;
    let crowd_density = 30;
    let crowd_size = 10;
    for (let j = 0; j < crowd_size; j++) {
      for (let i = 0; i < crowd_density; i++) {
        let curl = Math.random();
        let rad = (((i * 0.7 + curl) / 10.0) * 360.0 * Math.PI) / 180.0;
        let newcube = this.cloneAs("cube" + i + ":" + j, cube0);
        if (newcube != null) {
          newcube.transform = mat4.clone(newcube.transform);
          mat4.scale(newcube.transform, newcube.transform, [0.5, 0.5, 0.5]);
          mat4.translate(newcube.transform, newcube.transform, [
            Math.cos(rad) * (base_spread + spread * j),
            -0.5,
            Math.sin(rad) * (base_spread + spread * j),
          ]);
          mat4.rotateY(
            newcube.transform,
            newcube.transform,
            -(rad + (Math.PI * 90) / 180),
          );
          newcube.baseTransform = mat4.clone(newcube.transform);
          this.cubes.push(newcube);
        }
      }
    }
    this.cubes.push(cube0);

    for (let i = 0; i < 20; i += 1) {
      let note = {
        lane: getRandomInt(4),
        y: i + Math.Random(),
      };
      this.notes.push(note);
    }

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
          Math.sin(this.time / 100.0) * 0.01 * ((360 * Math.PI) / 180.0),
        );
      }
      // Spin me right round baby right round
      if (this.action === "Spin") {
        mat4.rotateY(
          cube.transform,
          cube.transform,
          0.02 * ((360 * Math.PI) / 180.0),
        );
      }
      // Jump up jump up and get down
      if (this.action === "Jump") {
        mat4.copy(cube.transform, cube.baseTransform);

        const elaped = this.time - this.jumptime;
        const period = 700.0;

        const phase = (elaped / period) * 2.0 * Math.PI;
        const bounce = (Math.sin(phase) + 1.0) * 0.5 * 0.6;
        mat4.translate(cube.transform, cube.transform, [0.0, bounce, 0.0]);
      }
      // Wave back and forth
      if (this.action === "Wave") {
        mat4.copy(cube.transform, cube.baseTransform);

        const tilt = Math.sin(this.time / 200.0) * ((10 * Math.PI) / 180.0);

        mat4.rotateZ(cube.transform, cube.transform, tilt);
      }
      // Stop collaborate and listen
      if (this.action === "Stay") {
        mat4.copy(cube.transform, cube.baseTransform);
      }
    });
    state.camera.rotateY((this.time / 7000.0) * 360.0, 2.0);
    state.camera.update();

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
