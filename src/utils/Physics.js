import * as THREE from 'three';

export class Physics {
    constructor() {
        // Physics constants
        this.gravity = 9.8;
    }
    
    update(deltaTime) {
        // This method would be used for global physics updates
        // For now, it's empty as physics are handled per-object
    }
    
    checkCollision(box1, box2) {
        // Check if two bounding boxes intersect
        return box1.intersectsBox(box2);
    }
    
    applyGravity(object, deltaTime) {
        // Apply gravity to an object
        object.velocity.y -= this.gravity * deltaTime;
    }
    
    checkGroundCollision(object, ground, groundHeight = 0) {
        // Check if object is on the ground
        if (object.position.y <= groundHeight + object.height / 2) {
            object.position.y = groundHeight + object.height / 2;
            object.velocity.y = 0;
            object.isGrounded = true;
            return true;
        }
        
        return false;
    }
    
    checkPlatformCollision(object, platform) {
        // Get platform dimensions
        const platformWidth = platform.geometry.parameters.width;
        const platformHeight = platform.geometry.parameters.height;
        const platformDepth = platform.geometry.parameters.depth;
        
        // Get platform position
        const platformPos = platform.position;
        
        // Check if object is above platform
        const objectBottom = object.position.y - object.height / 2;
        const platformTop = platformPos.y + platformHeight / 2;
        
        // Check if object is within platform x and z bounds
        const withinX = Math.abs(object.position.x - platformPos.x) < (platformWidth / 2 + object.width / 2);
        const withinZ = Math.abs(object.position.z - platformPos.z) < (platformDepth / 2 + object.depth / 2);
        
        // Check if object is falling onto platform
        if (object.velocity.y <= 0 && objectBottom <= platformTop && objectBottom >= platformTop - 0.2 && withinX && withinZ) {
            // Place object on top of platform
            object.position.y = platformTop + object.height / 2;
            object.velocity.y = 0;
            object.isGrounded = true;
            return true;
        }
        
        return false;
    }
    
    resolveCollision(object1, object2) {
        // Get the collision normal
        const normal = new THREE.Vector3()
            .subVectors(object1.position, object2.position)
            .normalize();
        
        // Calculate the relative velocity
        const relativeVelocity = new THREE.Vector3()
            .subVectors(object1.velocity, object2.velocity);
        
        // Calculate the impulse scalar
        const impulseMagnitude = -2 * relativeVelocity.dot(normal) / (1 / object1.mass + 1 / object2.mass);
        
        // Apply the impulse
        object1.velocity.add(normal.clone().multiplyScalar(impulseMagnitude / object1.mass));
        object2.velocity.add(normal.clone().multiplyScalar(-impulseMagnitude / object2.mass));
    }
    
    raycast(origin, direction, objects, maxDistance = Infinity) {
        // Create a raycaster
        const raycaster = new THREE.Raycaster(origin, direction, 0, maxDistance);
        
        // Get intersections
        const intersects = raycaster.intersectObjects(objects);
        
        // Return the closest intersection
        return intersects.length > 0 ? intersects[0] : null;
    }
} 