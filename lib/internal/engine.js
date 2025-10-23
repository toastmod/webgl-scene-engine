const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl2");

if (gl === null) {
    alert("WebGL 2 is not supported in your current browser.");
    return;
}

var state = {
    camera: new Camera(canvas.clientWidth, canvas.clientHeight),
    scene: {
        // Scene objects will go here with some schema we can agree on
        // Probably a good idea to make this like a node tree where each scene object has children
        // This way we can convert skeleton rig hierarchies to their own node branches and apply parented matrix transforms like in asn4
    },
};

var pTime = 0;

function beginRender() {
    // Rendering init stuff
    var pTime = 0;

    function render(timestamp) {
        update(pTime - timestamp);
        // TODO: Draw calls
        gl.clearColor(0.5, 0.5, 0.5, 1.0);

        // Queue next frame
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

// Logic updates
function update(delta) {}
