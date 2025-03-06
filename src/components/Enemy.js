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
        
        // Health and damage
        this.maxHealth = 3;
        this.health = this.maxHealth;
        this.isInvulnerable = false;
        this.invulnerabilityTime = 0.5; // seconds
        this.invulnerabilityTimer = 0;
        
        // Knockback
        this.isKnockedBack = false;
        this.knockbackDuration = 0;
        this.knockbackRecoveryTime = 0.3; // seconds
        
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
        // Update invulnerability timer
        if (this.isInvulnerable) {
            this.invulnerabilityTimer -= deltaTime;
            if (this.invulnerabilityTimer <= 0) {
                this.isInvulnerable = false;
                this.hideInvulnerabilityEffect();
            }
        }
        
        // Update knockback
        if (this.isKnockedBack) {
            this.knockbackDuration -= deltaTime;
            if (this.knockbackDuration <= 0) {
                this.isKnockedBack = false;
            } else {
                // Apply knockback velocity
                this.position.x += this.velocity.x * deltaTime;
                this.position.y += this.velocity.y * deltaTime;
                this.position.z += this.velocity.z * deltaTime;
                
                // Update mesh position
                this.mesh.position.copy(this.position);
                this.updateCollider();
                return; // Skip normal movement while knocked back
            }
        }
        
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
            // Player is out of range, patrol
            this.isChasing = false;
            this.patrol(deltaTime);
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
    
    // Add new methods for damage and knockback
    takeDamage(damage) {
        if (this.isInvulnerable) return;
        
        this.health -= damage;
        this.isInvulnerable = true;
        this.invulnerabilityTimer = this.invulnerabilityTime;
        
        // Show damage effect
        this.showDamageEffect();
        
        // Check if enemy is defeated
        if (this.health <= 0) {
            this.die();
        }
    }
    
    applyKnockback(direction) {
        this.isKnockedBack = true;
        this.knockbackDuration = this.knockbackRecoveryTime;
        
        // Set velocity based on knockback direction
        this.velocity.copy(direction);
    }
    
    showDamageEffect() {
        // Flash the enemy red
        const originalMaterials = [];
        this.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                originalMaterials.push({
                    mesh: child,
                    material: child.material
                });
                
                // Create a red material
                child.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            }
        });
        
        // Reset materials after a short delay
        setTimeout(() => {
            originalMaterials.forEach(item => {
                if (item.mesh) {
                    item.mesh.material = item.material;
                }
            });
        }, 100);
    }
    
    hideInvulnerabilityEffect() {
        // Reset any visual effects from invulnerability
        // Currently just using the damage flash effect
    }
    
    die() {
        // Create death particles
        const particleCount = 20;
        const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0x4e342e,
            transparent: true,
            opacity: 0.7
        });
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(this.position);
            
            // Add random offset
            particle.position.x += (Math.random() - 0.5) * 1;
            particle.position.y += (Math.random() - 0.5) * 1;
            particle.position.z += (Math.random() - 0.5) * 1;
            
            this.scene.add(particle);
            
            // Animate and remove particle
            const direction = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2 + 1, // Bias upward
                (Math.random() - 0.5) * 2
            ).normalize();
            
            const speed = 0.05 + Math.random() * 0.1;
            
            const animateParticle = () => {
                particle.position.add(direction.clone().multiplyScalar(speed));
                particle.material.opacity -= 0.02;
                
                if (particle.material.opacity <= 0) {
                    this.scene.remove(particle);
                    return;
                }
                
                requestAnimationFrame(animateParticle);
            };
            
            animateParticle();
        }
        
        // Play death sound
        if (this.assetLoader) {
            this.assetLoader.playSound('enemyDeath');
        }
        
        // Remove enemy from scene
        this.remove();
        
        // Emit death event for the Game class to handle
        const deathEvent = new CustomEvent('enemyDeath', {
            detail: {
                position: this.position.clone()
            }
        });
        window.dispatchEvent(deathEvent);
    }
} 