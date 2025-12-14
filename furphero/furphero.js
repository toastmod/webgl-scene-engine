const state = new GPUState();
const engine = new Engine();

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
          }),
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
      }),
    );
  }

  play() {
    this.midiplayer.play();
  }
}

// Define rendering pipeline layout for GPU state
state
  .init({
    programs: {
      // default: new Program({
      //     // Shader program source code
      //     source: "furphero/shaders/default",

      //     // Vertex attribute layout
      //     attributes: {
      //         aPosition: "vec3",
      //         aNormal: "vec3",
      //     },

      simpletexture: new Program({
        // Shader program source code
        source: "furphero/shaders/simpletexture",

        // Vertex attribute layout
        attributes: {
          aPosition: "vec3",
          aUV: "vec2",
          aNormal: "vec3",
        },

        // Uniform bindings
        uniforms: {
          normalMat: "mat4",
          pvm: "mat4",
          uTexture: "sampler2D",
          uCameraPos: "vec3",
          uMinFade: "float",
          uMaxFade: "float",
          uTime: "float",
        },
      }),
    },
    models: "furphero/models.json",
  })
  .then(() => engine.loadScene(state, TestScene))
  .then(() => engine.run(state));
