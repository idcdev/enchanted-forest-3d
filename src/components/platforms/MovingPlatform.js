import * as THREE from 'three';
import { Platform } from './Platform.js';

export class MovingPlatform extends Platform {
    constructor(scene, x, y, z, width, height, depth, moveAxis, moveDistance, moveSpeed) {
        super(scene, x, y, z, width, height, depth);
        
        // Movement properties
        this.moveAxis = moveAxis;
        this.moveDistance = moveDistance;
        this.moveSpeed = moveSpeed;
        this.initialPosition = new THREE.Vector3(x, y, z);
        this.time = 0;
        
        // Override material color to distinguish from regular platforms
        this.mesh.material.color.set(0x6699cc);
    }
    
    update(deltaTime) {
        // Update time
        this.time += deltaTime * this.moveSpeed;
        
        // Calculate new position using sine wave for smooth back-and-forth movement
        const offset = Math.sin(this.time) * this.moveDistance;
        
        // Apply offset to the appropriate axis
        if (this.moveAxis === 'x') {
            this.position.x = this.initialPosition.x + offset;
        } else if (this.moveAxis === 'y') {
            this.position.y = this.initialPosition.y + offset;
        } else if (this.moveAxis === 'z') {
            this.position.z = this.initialPosition.z + offset;
        }
        
        // Update mesh position
        this.mesh.position.copy(this.position);
        
        // Update collider
        this.updateCollider();
    }
    
    // Calculate velocity for player physics
    getVelocity() {
        const velocity = new THREE.Vector3(0, 0, 0);
        
        // Calculate instantaneous velocity based on position change
        const positionDelta = Math.cos(this.time) * this.moveDistance * this.moveSpeed;
        
        if (this.moveAxis === 'x') {
            velocity.x = positionDelta;
        } else if (this.moveAxis === 'y') {
            velocity.y = positionDelta;
        } else if (this.moveAxis === 'z') {
            velocity.z = positionDelta;
        }
        
        return velocity;
    }
} 