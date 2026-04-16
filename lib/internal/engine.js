class Engine {
    scene = null;
    state = null;

    pTime = document.timeline.currentTime;

    constructor() {}

    renderLoop(timestamp) {
        var exitFlow = false;
        switch (this.scene.update(timestamp - this.pTime)) {
            case FLOW.RENDER:
                this.state.render(this.scene);
                this.pTime = timestamp;
                break;

            case FLOW.EXIT_SCENE:
                return;

            default:
                break;
        }

        // Queue next frame
        requestAnimationFrame((ts) => {
            this.renderLoop(ts);
        });
    }

    async loadScene(state, sceneType) {
        console.log("Loading scene...");
        this.scene = new sceneType();
        await this.scene.init(state);

        console.log("Scene loaded!");
    }

    run(state) {
        console.log("Running engine!");
        this.state = state;
        this.renderLoop(document.timeline.currentTime);
    }
}
