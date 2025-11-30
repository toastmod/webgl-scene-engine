// class TagMap {
//     arr = [];
//     insert(obj) {
//         let tag = this.arr.length;
//         [obj];
//         return tag;
//     }

//     remove(tag) {
//     }
// }

class Node {
    transform = mat4.create();
    children = [];

    render() {}

    update() {}

}

class LightNode extends Node {

    render() {}

    update() {}

    constructor() {
        super()
    }
    
}

class ModelNode extends Node {
    model = null;
    texture = null;
    primitiveType = gl.TRIANGLES;

    render() {
        gl.useProgram(this.model.program.program);
        gl.bindVertexArray(this.model.vaoInfo.vao);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.model.indexBuffer);
        if (this.model.texture != null) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.model.texture);
        }
        gl.drawElements(
            this.primitiveType, 
            this.model.numVertices, 
            gl.UNSIGNED_SHORT, // Note: index buffer will always be u16
            0, // OFfset is always 0
        );
    }

    update() {}

    constructor(model) {
        super()
        this.model = model;
    }

}

class Scene {

    nodes = [];
    nodeTree = {};
    lights = {};   
    pvm = mat4.create();

    get(nodeName) {
        return this.nodes[this.nodeTree[nodeName]];
    }

    remove(nodeName) {
        if(nodeName in this.nodeTree) {
            delete this.nodeTree[nodeName];
        }
    }

    add(nodeName, node) {
        if(nodeName in this.nodeTree) {
            console.error("Tried to add node with name '"+nodeName+"' but it already exists.");
            return;
        } else {
            this.nodeTree[nodeName] = this.nodes.length;
            this.nodes.push(node);
        }
    }

    cloneAs(nodeName, node) {
        if(nodeName in this.nodeTree) {
            console.error("Tried to add cloned node with name '"+nodeName+"' but it already exists.");
            return null;
        } else {
            let clone = Object.assign(Object.create(Object.getPrototypeOf(node)), node);
            clone.children = [];
            clone.transform = Object.assign(Object.create(Object.getPrototypeOf(clone.transform)), clone.transform);
            this.nodeTree[nodeName] = this.nodes.length;
            this.nodes.push(clone);
            return clone;
        }
    }

    async load(state, jsonPath) {
        // TODO: error handling
        let data = await (await fetch(jsonPath)).json();
        let nodes = data["nodes"];

        for(let nKey in nodes) {
            let node = nodes[nKey];
            this.nodeTree[nKey] = this.nodes.length;
            this.nodes.push(new ModelNode(state.getModel(node.model)));
        }
    }

    // Interface functions
    async init(state) {}

    // Update state for an active scene
    // This is called during the render loop
    update(delta){
        return FLOW.NONE;
    }

    render(state) {
        this.nodes.forEach(node => {
            // Render each node 
            node.render();
        });
    }

    constructor() {}

}
