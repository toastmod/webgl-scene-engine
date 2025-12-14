const state = new GPUState();
const engine = new Engine();

const reader = new FileReader();

const loadingBar = document.getElementById("progbar");

var AudioContextFunc = null;
var audioContext = null; 

class SoundfontHost {
    sf = null;
    instr = null;
    info = null;
    constructor() {
        this.sf = new WebAudioFontPlayer();
    }

    async loadPerc(pnum) {
        this.info = this.sf.loader.drumInfo(pnum);
        this.sf.loader.startLoad(audioContext, this.info.url, this.info.variable);
        this.instr = await new Promise((resolve, reject) => {
            this.sf.loader.waitLoad(() => {
                resolve(window[this.info.variable]);
            })
        })
    }

    async loadInstrument(inum) {
        this.info = this.sf.loader.instrumentInfo(inum);
        this.sf.loader.startLoad(audioContext, this.info.url, this.info.variable);
        this.instr = await new Promise((resolve, reject) => {
            this.sf.loader.waitLoad(() => {
                resolve(window[this.info.variable]);
            })
        })
    }

    playNote(noteNum,vel) {
        this.sf.queueWaveTable(audioContext, audioContext.destination, this.instr, 0, noteNum, 0.5, vel/127); 
    }
    playDrum(noteNum,vel) {
        this.sf.queueWaveTable(audioContext, audioContext.destination, this.instr, 0, noteNum, 0.5, vel/127); 
    }
}

class SongHost {
    path = "";
    midiplayer = null;
    tracks = {};
    perc10 = {}; 
    midiplayer = null;
    voices = {};

    constructor(songName) {
        this.path = "./furphero/res/midi/" + songName + "/song";
        // sf = new SoundfontHost()
    }

    async load() {
        // Load a MIDI file
        const midi = await fetch(this.path + ".mid").then((x) => x.blob());

        const data = await fetch(this.path + ".json").then((x) => x.json());

        const tracks = this.tracks;
        const voices = this.voices;

        // Load channel 10 percussion
        for(let pi = 35; pi < 82; pi++) {
            let percent = 100*((81-pi)/(81-35));
            loadingBar.setAttribute("value", ""+percent);
            console.log("Loading drum "+pi);
            this.perc10[pi] = new SoundfontHost();
            await this.perc10[pi].loadPerc(pi-35);
            console.log("Loaded standard perc: ");
            console.log(this.perc10[pi].info);
            console.log(this.perc10[pi].sf);
        }

        const perc10 = this.perc10;
        const track_map = this.track_map;

        this.midiplayer = new MidiPlayer.Player(function (event) {
            console.log(event);
            if(event.name == "Program Change") {
                tracks[event.track] = event.value;
                if(event.channel == 10) {
                    tracks[event.track] = -1;
                }
            }


            if(event.name == "Note on") {
                if(tracks[event.track] == -1) {
                    perc10[event.noteNumber].playDrum(event.noteNumber, event.velocity);
                } else {
                    voices[tracks[event.track]].playNote(event.noteNumber, event.velocity);
                }
            }

            if(event.name == "Note off") {
            
            }

            // if (event.noteName != undefined && event.track in track_map) {
            //     let voice = tracks[track_map[event.track]];
            //     let noteLength = 70;
            //     if (event.name == "Note on") {
            //         voice.play({
            //             pitch: event.noteName,
            //             label: event.noteName,
            //         });
            //     } else if (event.name == "Note off") {
            //         voice.stop(event.noteName);
            //     }
            //     console.log(event);
            // }
        });

        this.midiplayer.loadDataUri(
            await new Promise((resolve, reject) => {
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(midi);
            })
        );

        // Load soundfont instruments
        console.log(this.midiplayer);
        for(let ii in this.midiplayer.instruments) {
            // let vi = this.voices.length;
            let i = this.midiplayer.instruments[ii];
            this.voices[i] = new SoundfontHost();
            await this.voices[i].loadInstrument(i);
            console.log("Loaded instrument: "+i);
            console.log(this.voices[i].info);
        }

    }

    play() {
        this.midiplayer.play();
    }
}

// Define rendering pipeline layout for GPU state
document.getElementById("start").onclick = ((e) => {
    AudioContextFunc = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextFunc();

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
                    },
                }),
            },
            models: "furphero/models.json",
        })
        .then(() => engine.loadScene(state, TestScene))
        .then(() => engine.run(state));

});
