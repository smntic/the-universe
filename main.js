import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PhysicsObject } from './src/PhysicsObject.js'
import { TimedPoint } from './src/TimedPoint.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { getRayIntersection, getPlanePosition } from './src/raycast.js'
import { updateControls, isControlPressed, handleControlKey } from './src/controls.js'
import { loadModel, updateAnimations } from './src/models.js';
import { addStars } from './src/stars.js';

// Create scene
const scene = new THREE.Scene();

// Create camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 10;
camera.position.z = 50;
camera.rotation.x = -0.4;

// Create light
const directionalLight = new THREE.DirectionalLight(0xffffff, 4);
directionalLight.position.set(-1500, 1500, 1500)
directionalLight.castShadow = true;
scene.add(directionalLight);

// Create ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

// Create renderer
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('three-canvas'), antialiasing: true });
renderer.shadows = true;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// Post processing steps
const composer = new EffectComposer(renderer);
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.3, 0.6, 0.2);
const gammaPass = new ShaderPass(GammaCorrectionShader);
composer.addPass(renderScene);
composer.addPass(bloomPass);
composer.addPass(gammaPass);

// Create HDRI Setup
const environmentMap = "HDRI/HDR_multi_nebulae.hdr";
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();
new RGBELoader()
    .setDataType(THREE.FloatType)
    .load(environmentMap, function(texture) {
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;

        scene.environment = envMap;
        scene.background = envMap;

        texture.dispose();
        pmremGenerator.dispose();
    });

// Create orbit controls
const controls = new OrbitControls(camera, renderer.domElement);

// Load models
let sun;
loadModel("Sun")
    .then((model) => {
        sun = model;
    })
    .catch((error) => {
        console.error("Error loading model:", error);
    });
let earth;
loadModel("Earth")
    .then((model) => {
        earth = model;
    })
    .catch((error) => {
        console.error("Error loading model:", error);
    });
let moon;
loadModel("Moon")
    .then((model) => {
        moon = model;
    })
    .catch((error) => {
        console.error("Error loading model:", error);
    });
let jupiter;
loadModel("Jupiter")
    .then((model) => {
        jupiter = model;
    })
    .catch((error) => {
        console.error("Error loading model:", error);
    });
let venus;
loadModel("Venus")
    .then((model) => {
        venus = model;
    })
    .catch((error) => {
        console.error("Error loading model:", error);
    });

// Create the grid for placing planets
const grid = new THREE.GridHelper(400, 200);
const gridMaterial = new THREE.LineBasicMaterial({ 
    color: 0xffffff, 
    opacity: 0.15, 
    transparent: true 
});
grid.material = gridMaterial;
grid.position.set(0, 0, 0);
grid.rotation.x += Math.PI/2;
const gridGroup = new THREE.Group();
gridGroup.add(grid);
scene.add(gridGroup);

// Arrow for when placing an object show initial velocity direction
const placingArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), 0, 0xffffff, 0, 0);
scene.add(placingArrow);

// Physics objects
const objects = [];

// Trail points
const points = [];

let addingObject = false;
let initialPoint = null;

// Animation Loop
const clock = new THREE.Clock();
function animate() {
    const deltaTime = clock.getDelta();

    requestAnimationFrame(animate);

    updateControls(controls, addingObject);

    objects.forEach(obj1 => {
        objects.forEach(obj2 => {
            if (obj1 != obj2) {
                obj1.pull(obj2); // use deltaTime
            }
        })
    });

    objects.forEach(obj => {
        obj.update(deltaTime);
        obj.render();
    });

    // updateAnimations(clock);
    updatePoints();
    updateGrid();

    controls.update();
    composer.render();
}

// Move the grid to face the camera
function updateGrid() {
    if (addingObject) {
        const planePos = getPlanePosition(camera);
        gridGroup.position.set(planePos.x, planePos.y, planePos.z);
        gridGroup.lookAt(camera.position);
    }

    gridGroup.visible = addingObject;
}

// Update move planet arrow
function updateArrow(event) {
    if (addingObject && initialPoint) {
        const start = initialPoint;
        const intersection = getRayIntersection(event, camera);
        const disp = intersection.clone().sub(start);
        const dir = disp.clone().normalize();
        const length = disp.length();
        placingArrow.position.copy(start);
        placingArrow.setDirection(dir);
        placingArrow.setLength(length, 0, 0);
        placingArrow.visible = true;
    } else {
        placingArrow.visible = false;
    }
}

// Add trail points
function addPoints() {
    objects.forEach(obj => {
        points.push(new TimedPoint(scene, obj.position.x, obj.position.y, obj.position.z, 3.0));
    });
}

// Update trail points
function updatePoints() {
    for (let i = points.length-1; i >= 0; i--) {
        if (!points[i].update()) {
            points.splice(i, 1); // Remove finished points
        }
    }
}

// Add planet object
function addObject(start, direction, mesh, mass) {
    const rotation = new THREE.Vector3().random();
    const angularVelocity = THREE.MathUtils.randFloat(0.5, 1.5);
    direction = direction.clone().multiplyScalar(10);
    objects.push(new PhysicsObject(scene, mesh, start, direction, rotation, angularVelocity, mass, false));
}

function getCurrentObject() {
    const selectElement = document.getElementById('type');
    const selectedValue = selectElement.value;
    if (selectedValue === "Earth") {
        return earth;
    } else if (selectedValue === "Jupiter") {
        return jupiter;
    } else if (selectedValue === "Venus") {
        return venus;
    } else if (selectedValue === "Sun") {
        return sun;
    } else if (selectedValue === "Moon") {
        return moon;
    }
}

function getCurrentMass() {
    const massElement = document.getElementById('mass');
    const massValue = massElement.value;
    console.log(massValue);
    return massValue
}

// Handle mouse movement
function onMouseMove(event) {
    updateArrow(event);
}

// Handle mouse click down
function onMouseDown(event) {
    if (!isControlPressed()) return;

    const intersection = getRayIntersection(event, camera);

    if (intersection) {
        initialPoint = intersection.clone();
        addingObject = true;
    }
}

// Handle mouse click up
function onMouseUp(event) {
    if (initialPoint) {
        const intersection = getRayIntersection(event, camera);

        if (intersection && initialPoint) {
            const difference = intersection.clone().sub(initialPoint);
            const direction = difference.clone().multiplyScalar(-1);
            addObject(initialPoint, direction, getCurrentObject(), getCurrentMass(), false);
        }
    }

    initialPoint = null;
    addingObject = false;
    updateArrow(event);
}

handleControlKey();
window.addEventListener('mousedown', onMouseDown, false);
window.addEventListener('mouseup', onMouseUp, false);
window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    controls.update();
});

animate();

addStars(scene, 1000);
setInterval(addPoints, 100);
