class Camera {
    constructor(screenW, screenH) {
        this.position = vec3.create();
        this.rotation = mat4.create();
        this.scale = vec3.create();
        this.projection = mat4.create();
        this.view = mat4.create();
        this.screen = {
            width: screenW,
            height: screenH
        }
    }

    update() {
        // TODO: calculate projection and view matrices
        mat4.projection(this.screen.width, this.screen.height, 400);
    }

    rotate(xDeg, y, z) {
        // TODO: apply rotation at centroid of camera
    }
}
