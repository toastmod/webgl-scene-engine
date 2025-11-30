class Camera {
  position = vec3.create();
  center = vec3.create();
  up = vec3.fromValues(0.0, 1.0, 0.0);

  projection = mat4.create();
  view = mat4.create();

  fovy = (60.0 * Math.PI) / 180.0; // Vertical field of view in radians
  aspect = 1.0; // Aspect ratio of the canvas
  near = 0.1; // Near clipping plane
  far = 100.0; // Far clipping plane

  constructor(screenW, screenH) {
    this.screen = {
      width: screenW,
      height: screenH,
    };

    this.aspect = screenW / screenH;

    mat4.perspective(
      this.projection,
      this.fovy,
      this.aspect,
      this.near,
      this.far,
    );

    mat4.lookAt(this.view, this.position, this.center, this.up);
  }

  cameraTween(a, b, t) {
    vec3.lerp(this.position, a, b, t);
  }

  update() {
    let time = null;
    let t = 0.5 * Math.sin(time) + 1.0; // sin between 0 and 1
    // TODO: calculate projection and view matrices
    mat4.perspective(
      this.projection,
      this.fovy,
      this.aspect,
      this.near,
      this.far,
    );
    mat4.lookAt(this.view, this.position, this.center, this.up);
  }

  lookAt(center) {
    this.center = center;
    mat4.lookAt(this.view, this.position, this.center, this.up);
  }

  rotate(xDeg, y, z) {
    // TODO: apply rotation at centroid of camera
    mat4.translate(this);
  }

  calcPVM(pvm, modelMat) {
    mat4.multiply(pvm, this.projection, this.view);
    mat4.multiply(pvm, pvm, modelMat);
  }
}
