import * as THREE from 'three';

export class Enemy {
    constructor(scene, x, y, z, patrolRadius, assetLoader) {
        this.scene = scene;
        this.position = new THREE.Vector3(x, y, z);
        this.initialPosition = new THREE.Vector3(x, y, z);
        this.patrolRadius = patrolRadius;
        this.assetLoader = assetLoader;
        
        // Enemy state
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.direction = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0);
        
        // Enemy stats
        this.moveSpeed = 3;
        this.detectionRadius = 10;
        this.isChasing = false;
        this.hasDetectedPlayer = false;
        
        // Patrol variables
        this.patrolAngle = Math.random() * Math.PI * 2;
        this.patrolSpeed = 0.5;
        
        // Create enemy mesh
        this.createEnemyMesh();
        
        // Create collider
        this.collider = new THREE.Box3().setFromObject(this.mesh);
    }
    
    createEnemyMesh() {
        // Create a corrupted creature
        const bodyGeometry = new THREE.SphereGeometry(0.6, 8, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x4e342e,
            roughness: 0.8,
            metalness: 0.2
        });
        
        this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Add eyes
        const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.25, 0.2, 0.5);
        this.mesh.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.25, 0.2, 0.5);
        this.mesh.add(rightEye);
        
        // Add spikes
        const spikeGeometry = new THREE.ConeGeometry(0.15, 0.5, 8);
        const spikeMaterial = new THREE.MeshStandardMaterial({
            color: 0x212121,
            roughness: 0.7,
            metalness: 0.3
        });
        
        const spikePositions = [
            { x: 0, y: 0.6, z: 0, rx: 0, ry: 0, rz: 0 },
            { x: 0.5, y: 0.3, z: 0, rx: 0, ry: 0, rz: Math.PI / 2 },
            { x: -0.5, y: 0.3, z: 0, rx: 0, ry: 0, rz: -Math.PI / 2 },
            { x: 0, y: 0, z: 0.5, rx: Math.PI / 2, ry: 0, rz: 0 },
            { x: 0, y: 0, z: -0.5, rx: -Math.PI / 2, ry: 0, rz: 0 }
        ];
        
        for (const pos of spikePositions) {
            const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
            spike.position.set(pos.x, pos.y, pos.z);
            spike.rotation.set(pos.rx, pos.ry, pos.rz);
            this.mesh.add(spike);
        }
        
        // Add a subtle glow effect
        const light = new THREE.PointLight(0xff0000, 0.5, 2);
        light.position.set(0, 0, 0);
        this.mesh.add(light);
        
        this.scene.add(this.mesh);
    }
    
    update(deltaTime, player) {
        // Check distance to player
        const distanceToPlayer = this.position.distanceTo(player.position);
        
        if (distanceToPlayer < this.detectionRadius) {
            // Player is within detection radius, chase them
            if (!this.isChasing) {
                this.isChasing = true;
                
                // Play detection sound when first detecting the player
                if (!this.hasDetectedPlayer && this.assetLoader) {
                    this.assetLoader.playSound('enemyDetect');
                    this.hasDetectedPlayer = true;
                }
            }
            this.chasePlayer(player, deltaTime);
        } else {
            // Player is out of range, return to patrolling
            this.isChasing = false;
            this.patrol(deltaTime);
            
            // Reset detection flag when player is far away
            if (distanceToPlayer > this.detectionRadius * 1.5) {
                this.hasDetectedPlayer = false;
            }
        }
        
        // Update position based on velocity
        this.position.x += this.velocity.x * deltaTime;
        this.position.z += this.velocity.z * deltaTime;
        
        // Keep y position constant (enemy doesn't jump)
        this.position.y = this.initialPosition.y;
        
        // Update mesh position
        this.mesh.position.copy(this.position);
        
        // Update mesh rotation
        this.mesh.rotation.copy(this.rotation);
        
        // Update collider
        this.updateCollider();
    }
    
    patrol(deltaTime) {
        // Move in a circular pattern around initial position
        this.patrolAngle += this.patrolSpeed * deltaTime;
        
        const targetX = this.initialPosition.x + Math.cos(this.patrolAngle) * this.patrolRadius;
        const targetZ = this.initialPosition.z + Math.sin(this.patrolAngle) * this.patrolRadius;
        
        // Calculate direction to target
        this.direction.set(
            targetX - this.position.x,
            0,
            targetZ - this.position.z
        );
        
        // Normalize direction
        if (this.direction.length() > 0) {
            this.direction.normalize();
        }
        
        // Set velocity based on direction and move speed
        this.velocity.x = this.direction.x * this.patrolSpeed;
        this.velocity.z = this.direction.z * this.patrolSpeed;
        
        // Update rotation to face movement direction
        if (this.direction.length() > 0) {
            const targetRotation = Math.atan2(this.direction.x, this.direction.z);
            this.rotation.y = targetRotation;
        }
    }
    
    chasePlayer(player, deltaTime) {
        // Calculate direction to player
        this.direction.set(
            player.position.x - this.position.x,
            0,
            player.position.z - this.position.z
        );
        
        // Normalize direction
        if (this.direction.length() > 0) {
            this.direction.normalize();
        }
        
        // Set velocity based on direction and move speed
        this.velocity.x = this.direction.x * this.moveSpeed;
        this.velocity.z = this.direction.z * this.moveSpeed;
        
        // Update rotation to face player
        if (this.direction.length() > 0) {
            const targetRotation = Math.atan2(this.direction.x, this.direction.z);
            
            // Smoothly interpolate current rotation to target rotation
            const rotationSpeed = 5;
            const angleDiff = targetRotation - this.rotation.y;
            
            // Handle angle wrapping
            let shortestAngle = ((angleDiff + Math.PI) % (Math.PI * 2)) - Math.PI;
            
            this.rotation.y += shortestAngle * rotationSpeed * deltaTime;
        }
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