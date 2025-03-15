import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// Create Scene
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xcccccc, 0.01);

// Create Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;
const directionalLight = new THREE.DirectionalLight(0xffffff, 4);
directionalLight.position.set(-1500, 1500, 1500)
directionalLight.castShadow = true;
scene.add(directionalLight);
scene.add(camera);

// Create Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);



// Create Renderer
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('three-canvas') });
renderer.shadows = true;
renderer.shadowType = 1;
renderer.shadowMap.Enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const renderScene = new RenderPass(scene, camera);
const composer = new EffectComposer(renderer);
composer.addPass(renderScene);

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.3,
    0.6,
    0.2
);

const gammaPass = new ShaderPass(GammaCorrectionShader);

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

// Create Loader
const loader = new GLTFLoader();

let mixer;
loader.load("models/earth3.glb", function(gltf) {
    scene.add(gltf.scene);

    mixer = new THREE.AnimationMixer(gltf.scene);
    const clips = gltf.animations;
    const clip = THREE.AnimationClip.findByName(clips, "Animation");
    const action = mixer.clipAction(clip);
    action.play();

    gltf.scene.traverse((child) => {
        console.log("Material:", child.material);
        console.log("Base Map:", child.material.map);
        console.log("Normal Map:", child.material.normalMap);
        console.log("Roughness Map:", child.material.roughnessMap);
    });

    }, undefined, function(error) {    
        console.error("Issue loading model");
    }
);

// Star detail
function addStar() {
    const geometry = new THREE.SphereGeometry(0.25, 3, 3);
    const material = new THREE.MeshStandardMaterial( {color: 0xffffff} )
    const star = new THREE.Mesh(geometry, material);

    const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));

    star.position.set(x, y, z);

    scene.add(star);
}

for (let i = 0; i < 200; i++) {
    addStar();
}

// HDRI check

// scene.traverse((child) => {
//     if (child.isMesh && child.material && child.material.envMapIntensity !== undefined) {
//         child.material.envMapIntensity = 15.0;
//     }
// });


// Create Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);

const clock = new THREE.Clock();
// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    mixer.update(clock.getDelta()/10);

    controls.update();
    composer.render();
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