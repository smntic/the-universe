import * as THREE from 'three';

const planeDist = 40;

function getCameraDirection(camera) {
    return camera.getWorldDirection(new THREE.Vector3()).normalize();
}

export function getPlanePosition(camera) {
    const planeNormal = getCameraDirection(camera).clone();
    const planePoint = camera.position.clone().add(planeNormal.clone().multiplyScalar(planeDist));
    return planePoint;
}

export function getPlaneNormal(camera) {
    const planeNormal = getCameraDirection(camera).clone();  
    return planeNormal;
}

export function getRayIntersection(event, camera) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Define ray from camera and mouse
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const planePoint = getPlanePosition(camera);
    const planeNormal = getPlaneNormal(camera);

    // Create a plane at a fixed distance in front of the camera
    const plane = new THREE.Plane();
    plane.setFromNormalAndCoplanarPoint(planeNormal, planePoint);

    // Calculate the intersection of the ray with the plane
    const ray = raycaster.ray;
    const intersection = new THREE.Vector3();
    const intersects = ray.intersectPlane(plane, intersection);

    return intersects ? intersection : null;
}
