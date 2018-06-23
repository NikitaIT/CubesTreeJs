

let WIDTH = 500;
let HEIGHT = 500;

// set some camera attributes
let VIEW_ANGLE = 75;
let ASPECT = WIDTH / HEIGHT;
let NEAR = 0.1;
let FAR = 1000;
// [B](f: (A) ⇒ [B]): [B]  ; Although the types in the arrays aren't strict (:
function flatMap(lambda : Function ): any[] {
    return Array.prototype.concat.apply([], this.map(lambda));
}
class CubeExt {
    static readonly createNode = (): THREE.Mesh => {
        const   sphereGeometry  =   new THREE.SphereGeometry(0.04,32),
                randomColor     =   '#'+(Math.random()*0xFFFFFF<<0).toString(16);
        sphereGeometry.faces.map( x => x.color.setStyle( randomColor ) );
        return new THREE.Mesh(
                sphereGeometry,
                new THREE.MeshBasicMaterial({ color: 0x8888ff, vertexColors: THREE.FaceColors } )
            );
    };
    static readonly ResetColors = () => Array.from(Array(8*3).keys()).map( () => new THREE.Color(0,0,0));
    static setEdgesGeometryColor(edgesGeometry :THREE.EdgesGeometry, colors: THREE.Color[]){
        const colorsFlat = flatMap.bind( colors )( (x: THREE.Color) => x.toArray());
        edgesGeometry.addAttribute( 'color', new THREE.Float32Attribute( colorsFlat, 3 ) );
    }
}
class CubeReal {
    cube: THREE.Mesh = new THREE.Mesh();
    targetList: THREE.Mesh[] = [];
    geometry: THREE.BoxGeometry;
    edgesGeometry :THREE.EdgesGeometry;
    /**
     * Creates a new cube object
     * @return {THREE.Mesh} a cube
     */
    constructor(position: THREE.Vector3 = new THREE.Vector3(Math.random(),Math.random(),-Math.random()),
                width = 1, height = 1, depth = 1){
        const  material    = new THREE.LineDashedMaterial( {
                linewidth: 4,
                vertexColors: THREE.VertexColors
            } );
        this.geometry       = new THREE.BoxGeometry(width, height, depth);
        this.edgesGeometry  = new THREE.EdgesGeometry( this.geometry, 10 );
        CubeExt.setEdgesGeometryColor( this.edgesGeometry, CubeExt.ResetColors() );
        const wireframe = new THREE.LineSegments( this.edgesGeometry, material,2 );
        wireframe.renderOrder = 2;
        this.cube.add( wireframe );
        this.targetList =
            Array.from(Array(8).keys())
                .map(CubeExt.createNode)
                .map((x,i) => {
                    x.position.add(this.geometry.vertices[i]);
                    this.cube.add(x);
                    return x;
                });
        this.cube.position.add(position);
    }
}
export default class Scene {
    selector: string;
    canvasElement: JQuery;
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    material: THREE.MeshNormalMaterial;
    mouse = new THREE.Vector2();
    raycaster = new THREE.Raycaster();
    cubes : CubeReal[];
    rotVelocities = {
        x: 0.01,
        y: 0.01,
        z: 0.01
    };
    constructor(selector: string) {
        this.selector = selector;
        this.canvasElement = $(this.selector);
        this.renderer = new THREE.WebGLRenderer({
            canvas: <HTMLCanvasElement>this.canvasElement.get(0),
            alpha: true,     // transparent background
            antialias: true // smooth edges
        });
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
        this.cubes = Array.from(Array(1).keys()).map(()=> new CubeReal());
        // create a cube and add it to the scene
        this.cubes.forEach((x) => this.scene.add(x.cube));
        // add the camera to the scene
        this.scene.add(this.camera);
        // move camera back so we can see the cube
        this.camera.position.z = 2;
        // set the renderer size
        this.renderer.setSize(WIDTH, HEIGHT);
        document.addEventListener( 'mousedown', this.onDocumentMouseDown, false );
    }
    onDocumentMouseDown = ( event: MouseEvent ) => {
        // the following line would stop any other event handler from firing
        // (such as the mouse's TrackballControls)
        // event.preventDefault();
        let et = event.target as HTMLElement, de = this.renderer.domElement;
        // update the mouse variable
        this.mouse.x = ( (event.clientX - et.offsetLeft) / de.width ) * 2 - 1;
        this.mouse.y = - ( (event.clientY - et.offsetTop) / de.height ) * 2 + 1;
        // find intersections
        // create a Ray with origin at the mouse position
        //   and direction into the scene (camera direction)
        this.raycaster.setFromCamera( this.mouse, this.camera );
        // create an array containing all objects in the scene with which the ray intersects
        var intersects = this.raycaster.intersectObjects( flatMap.bind(this.cubes )( (x: CubeReal) => x.targetList) );

        // if there is one (or more) intersections
        if ( intersects.length > 0 )
        {
            this.onDocumentMouseDownHandler(intersects[ 0 ].object as THREE.Mesh);
        }
    };
    onDocumentMouseDownHandler( sphereMesh: THREE.Mesh){
        // change the color of the closest face.
        const   color = (sphereMesh.geometry as THREE.SphereGeometry).faces[0].color,
                position = sphereMesh.position,
                Id = sphereMesh.uuid;
        this.cubes
            .filter(cube => cube.targetList.some((x)=> x.uuid === Id))
            .forEach((cube)=> Scene.cubesDeque(color, position, cube));
    }
    static cubesDeque(color: THREE.Color, position: THREE.Vector3, cube: CubeReal){
        const   baseGeometry = new THREE.Geometry().fromBufferGeometry(cube.edgesGeometry),
                colors = CubeExt.ResetColors();
        baseGeometry.vertices
            .map((x, i) =>  x.equals(position) ? i : -1 )
            .filter(x => x!==-1)
            .map(x => colors[x] = color);
        CubeExt.setEdgesGeometryColor(cube.edgesGeometry,  colors );
    };
    /**
     * Renders the scene
     * @return {void}
     */
    render() : void {
        // render the scene
        this.renderer.render(this.scene, this.camera);
        // rotate cube each render
        this.cubes.forEach(x=> {
            x.cube.rotation.x += this.rotVelocities.x;
            x.cube.rotation.y += this.rotVelocities.y;
            x.cube.rotation.z += this.rotVelocities.z;
        })
    }

    /**
     * gets cube rotation velocity on x axis
     */
    get rotX() {
        return this.rotVelocities.x;
    }

    /**
     * sets cube rotation velocity on x axis
     */
    set rotX(velocity: number) {
        this.rotVelocities.x = velocity;
    }

    /**
     * gets cube rotation velocity on y axis
     */
    get rotY() {
        return this.rotVelocities.y;
    }

    /**
     * sets cube rotation velocity on y axis
     */
    set rotY(velocity: number) {
        this.rotVelocities.y = velocity;
    }

    /**
     * gets cube rotation velocity on z axis
     */
    get rotZ() {
        return this.rotVelocities.z;
    }

    /**
     * sets cube rotation velocity on z axis
     */
    set rotZ(velocity: number) {
        this.rotVelocities.z = velocity;
    }

    set N(n: number) {
        if(this.cubes.length !== n){
            this.cubes.forEach((x) =>this.scene.remove(x.cube));
            this.cubes = Array.from(Array(n).keys()).map(()=> new CubeReal());
            this.cubes.forEach((x) => this.scene.add(x.cube));
        }
    }
}
