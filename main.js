import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PhysicsObject } from './src/PhysicsObject.js'
import { TimedPoint } from './src/TimedPoint.js'
import { getRayIntersection, getPlanePosition } from './src/raycast.js'
import { updateControls, isControlPressed, handleControlKey } from './src/controls.js'

// Create scene
const scene = new THREE.Scene();

// Create camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 5;
camera.position.z = 10;
camera.rotation.x = -0.4;

// Create renderer
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('three-canvas') });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create orbit controls
const controls = new OrbitControls(camera, renderer.domElement);

// Create a cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);

// Create the grid for placing planets
const grid = new THREE.GridHelper(100, 200);
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
objects.push(new PhysicsObject(scene, cube, new THREE.Vector3(6, 2, 2), new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0.4, 0.3), 2, 2, true));

// Trail points
const points = [];

let addingObject = false;
let initialPoint = null;

// Animation Loop
const clock = new THREE.Clock();
let previousTime = 0;
function animate() {
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - previousTime;
    previousTime = elapsedTime;

    requestAnimationFrame(animate);

    updateControls(controls, addingObject);

    objects.forEach(obj1 => {
        objects.forEach(obj2 => {
            if (obj1 != obj2) {
                obj1.pull(obj2);
            }
        })
    });

    objects.forEach(obj => {
        obj.update(deltaTime);
        obj.render();
    });

    updatePoints();
    updateGrid();

    controls.update();
    renderer.render(scene, camera);
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
function addObject(start, direction) {
    const rotation = new THREE.Vector3().random();
    const angularVelocity = THREE.MathUtils.randFloat(0.5, 1.5);
    objects.push(new PhysicsObject(scene, cube, start, direction, rotation, angularVelocity, 2, false));
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
            addObject(initialPoint, direction);
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
setInterval(addPoints, 100);
