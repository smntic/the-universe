import * as THREE from 'three';

export function addStars(scene, count) {
    for (let i = 0; i < count; i++) {
        addStar(scene);
    }
}

function addStar(scene) {
    const geometry = new THREE.SphereGeometry(0.75, 3, 3);

    const pastelColors = ['#FCEDB1', '#E7DDFF', '#FF9999']
    const randomColor = pastelColors[Math.floor(Math.random() * pastelColors.length)];

    const material = new THREE.MeshStandardMaterial({
        color: randomColor,
        emissive: randomColor,
        emissiveIntensity: 1.0
    })
    const star = new THREE.Mesh(geometry, material);

    const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(1000));

    star.position.set(x, y, z);

    scene.add(star);
}
