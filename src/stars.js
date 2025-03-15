import * as THREE from 'three';

export function addStars(scene, count) {
    for (let i = 0; i < count; i++) {
        addStar(scene);
    }
}

function addStar(scene) {
    const geometry = new THREE.SphereGeometry(1.0, 3, 3);
    const material = new THREE.MeshStandardMaterial( {color: 0xffffff} )
    const star = new THREE.Mesh(geometry, material);

    const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(300));

    star.position.set(x, y, z);

    scene.add(star);
}
