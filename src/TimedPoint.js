import * as THREE from 'three';

export class TimedPoint {
    constructor(scene, x, y, z, time) {
        this.scene = scene;
        this.time = time;
        this.startTime = performance.now(); // Get start time

        // Create a transparent material for the point
        const geometry = new THREE.SphereGeometry(0.2, 8, 8); // Small sphere
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1.0 });


        this.point = new THREE.Mesh(geometry, material);
        this.point.position.set(x, y, z);

        // Add to scene
        this.scene.add(this.point);
    }

    update() {
        const elapsed = (performance.now() - this.startTime) / 1000; // Convert to seconds
        const remaining = this.time - elapsed;

        if (remaining <= 0) {
            this.scene.remove(this.point);
            this.dispose();
            return false; // Mark for deletion
        }

        // Reduce opacity as time passes
        this.point.material.opacity = remaining / this.time;
        return true; // Still alive
    }

    dispose() {
        this.point.geometry.dispose();
        this.point.material.dispose();
    }
}
