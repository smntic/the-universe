import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PhysicsObject } from './src/PhysicsObject.js'

// Create Scene
const scene = new THREE.Scene();

// Create Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 5;
camera.position.z = 10;
camera.rotation.x = -0.4;

// Create Renderer
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('three-canvas') });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);

// Create a Cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);

const objects = [];
objects.push(new PhysicsObject(scene, cube, new THREE.Vector3(-5, 1, 0), new THREE.Vector3(5, 0, 3), new THREE.Vector3(0, 1.5, -0.5), 0.5, 10, false));
objects.push(new PhysicsObject(scene, cube, new THREE.Vector3(6, 2, 2), new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0.4, 0.3), 2, 2, true));

// Animation Loop
const clock = new THREE.Clock();
let previousTime = 0;
function animate() {
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - previousTime;
    previousTime = elapsedTime;
    
    requestAnimationFrame(animate);

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

    controls.update();
    renderer.render(scene, camera);
}

// Resize Handler
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    controls.update();
});

animate();
