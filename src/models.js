import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

export function loadModel(modelName) {
    return new Promise((resolve, reject) => {
        loader.load(
            "models/" + modelName + ".glb", 
            function(gltf) {
                const mixer = new THREE.AnimationMixer(gltf.scene);
                const clips = gltf.animations;
                const clip = THREE.AnimationClip.findByName(clips, "Animation");

                if (clip) {
                    const action = mixer.clipAction(clip);
                    action.play();
                }

                // Resolve the promise with the loaded model's scene
                resolve(gltf.scene); 
            },
            undefined,
            function(error) {
                // Reject the promise if an error occurs
                reject(error);
                console.error("Issue loading model:", error);
            }
        );
    });
}

export function updateAnimations(clock) {
    mixers.forEach((mixer) => {
        mixer.update(clock.getDelta());
    });
}
