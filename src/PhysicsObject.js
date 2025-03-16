import * as THREE from 'three';

const G = 1.0;
const UP = new THREE.Vector3(0, 1, 0);

export class PhysicsObject {
    constructor(scene, mesh, position, velocity, direction, angularVelocity, mass, isStatic) {
        this.mesh = mesh.clone();
        scene.add(this.mesh);

        // Physics properties
        this.mass = mass;
        this.direction = direction.clone().normalize();
        this.position = position.clone();
        this.velocity = velocity.clone();
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.rotationQuaternion = new THREE.Quaternion().setFromUnitVectors(UP, direction);
        this.angularVelocity = angularVelocity;
        this.isStatic = isStatic;
    }

    pull(other) {
        const disp = this.position.clone().sub(other.position);
        const normal = disp.normalize();
        const r = disp.length();
        const force = normal.clone().multiplyScalar(G * this.mass * other.mass / (r*r));
        other.applyForce(force);
    }

    applyForce(force) {
        if (this.isStatic) {
            return;
        }

        // F = m*a
        this.acceleration.add(force.clone().divideScalar(this.mass));
    }

    update(deltaTime) {
        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        this.acceleration.set(0, 0, 0);

        this.rotationQuaternion.multiply(
            new THREE.Quaternion().setFromEuler(new THREE.Euler(0, this.angularVelocity * deltaTime, 0))
        );
    }

    render() {
        this.mesh.position.copy(this.position);
        this.mesh.rotation.setFromQuaternion(this.rotationQuaternion);
    }

    delete(scene) {
        scene.remove(this.mesh);
    }
};
