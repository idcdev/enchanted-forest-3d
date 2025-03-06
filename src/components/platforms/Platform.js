import * as THREE from 'three';

export class Platform {
    constructor(scene, x, y, z, width, height, depth) {
        this.scene = scene;
        this.position = new THREE.Vector3(x, y, z);
        this.dimensions = new THREE.Vector3(width, height, depth);
        this.isActive = true;
        
        // Create platform mesh
        this.createPlatformMesh();
        
        // Create collider
        this.collider = new THREE.Box3().setFromObject(this.mesh);
    }
    
    createPlatformMesh() {
        // Create a simple box geometry for the platform
        const geometry = new THREE.BoxGeometry(
            this.dimensions.x,
            this.dimensions.y,
            this.dimensions.z
        );
        
        // Create material with a green color
        const material = new THREE.MeshStandardMaterial({
            color: 0x66aa66,
            roughness: 0.7,
            metalness: 0.2
        });
        
        // Create mesh and add to scene
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        this.scene.add(this.mesh);
    }
    
    update(deltaTime) {
        // Base platform doesn't need updates
        // This method will be overridden by subclasses
    }
    
    updateCollider() {
        this.collider.setFromObject(this.mesh);
    }
    
    getCollider() {
        return this.collider;
    }
    
    isVisible() {
        return this.isActive;
    }
    
    setVisible(visible) {
        this.isActive = visible;
        this.mesh.visible = visible;
    }
    
    remove() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
    }
} 