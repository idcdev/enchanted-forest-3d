import * as THREE from 'three';

export class Collectible {
    constructor(scene, type, x, y, z) {
        this.scene = scene;
        this.type = type; // 'crystal' or 'seed'
        this.position = new THREE.Vector3(x, y, z);
        
        // Create mesh based on type
        this.createMesh();
        
        // Create collider
        this.collider = new THREE.Box3().setFromObject(this.mesh);
        
        // Animation properties
        this.initialY = y;
        this.rotationSpeed = Math.random() * 0.02 + 0.01;
        this.bobSpeed = Math.random() * 0.002 + 0.001;
        this.bobHeight = 0.2;
        this.bobTime = Math.random() * Math.PI * 2; // Random start phase
    }
    
    createMesh() {
        if (this.type === 'crystal') {
            this.createCrystal();
        } else if (this.type === 'seed') {
            this.createSeed();
        }
    }
    
    createCrystal() {
        // Create a crystal-like geometry
        const geometry = new THREE.OctahedronGeometry(0.4, 0);
        const material = new THREE.MeshStandardMaterial({
            color: 0x2196f3,
            emissive: 0x0d47a1,
            emissiveIntensity: 0.5,
            roughness: 0.2,
            metalness: 0.8
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Only add light in medium or high quality
        if (this.scene.parent && this.scene.parent.quality && 
            (this.scene.parent.quality.maxLights > 0)) {
            const light = new THREE.PointLight(0x2196f3, 1, 2);
            light.position.set(0, 0, 0);
            this.mesh.add(light);
        }
        
        this.scene.add(this.mesh);
    }
    
    createSeed() {
        // Create a seed-like geometry
        const geometry = new THREE.SphereGeometry(0.3, 8, 8);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffeb3b,
            emissive: 0xfbc02d,
            emissiveIntensity: 0.5,
            roughness: 0.3,
            metalness: 0.5
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Only add light in medium or high quality
        if (this.scene.parent && this.scene.parent.quality && 
            (this.scene.parent.quality.maxLights > 0)) {
            const light = new THREE.PointLight(0xffeb3b, 0.5, 1);
            light.position.set(0, 0, 0);
            this.mesh.add(light);
        }
        
        this.scene.add(this.mesh);
    }
    
    update(deltaTime) {
        // Rotate the collectible
        this.mesh.rotation.y += this.rotationSpeed;
        
        // Bob up and down
        this.bobTime += this.bobSpeed;
        this.mesh.position.y = this.initialY + Math.sin(this.bobTime) * this.bobHeight;
        
        // Update collider
        this.updateCollider();
    }
    
    updateCollider() {
        this.collider.setFromObject(this.mesh);
    }
    
    getCollider() {
        return this.collider;
    }
    
    remove() {
        // Remove from scene
        this.scene.remove(this.mesh);
    }
} 