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
        
        // Enemy stats - REDUCED SPEED AND DETECTION RADIUS
        this.moveSpeed = 2; // Reduced from 3
        this.detectionRadius = 8; // Reduced from 10
        this.isChasing = false;
        this.hasDetectedPlayer = false;
        
        // Attack state - NEW
        this.isPreparingAttack = false;
        this.isAttacking = false;
        this.attackPreparationTime = 1.0; // 1 second to telegraph attack
        this.attackPreparationTimer = 0;
        this.attackDuration = 0.5; // Attack lasts 0.5 seconds
        this.attackTimer = 0;
        this.attackCooldown = 2.0; // 2 seconds between attacks
        this.attackCooldownTimer = 0;
        this.attackRange = 2.0; // Must be this close to attack
        this.attackDamage = 5; // Reduced from 10 (implied in Game.js)
        
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
        
        // Stun - NEW
        this.isStunned = false;
        this.stunDuration = 0;
        this.stunTime = 1.0; // 1 second stun when hit
        
        // Patrol variables
        this.patrolAngle = Math.random() * Math.PI * 2;
        this.patrolSpeed = 0.5;
        
        // Create enemy mesh
        this.createEnemyMesh();
        
        // Create collider
        this.collider = new THREE.Box3().setFromObject(this.mesh);
        
        // Attack indicator - NEW
        this.attackIndicator = null;
        this.createAttackIndicator();
    }
    
    createEnemyMesh() {
        // Create enemy mesh
        const geometry = new THREE.SphereGeometry(0.5, 16, 16);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,
            emissive: 0x330000, // Use emissive instead of a light
            emissiveIntensity: 0.5
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Add enemy to scene
        this.scene.add(this.mesh);
        
        // Create collider
        this.collider = new THREE.Box3().setFromObject(this.mesh);
        
        // Only add light in medium or high quality
        if (this.scene.parent && this.scene.parent.quality && 
            (this.scene.parent.quality.maxLights > 0)) {
            const light = new THREE.PointLight(0xff0000, 0.5, 2);
            light.position.set(0, 0, 0);
            this.mesh.add(light);
        }
    }
    
    createAttackIndicator() {
        const geometry = new THREE.RingGeometry(1, 1.2, 32);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.0,
            side: THREE.DoubleSide
        });
        
        this.attackIndicator = new THREE.Mesh(geometry, material);
        this.attackIndicator.rotation.x = Math.PI / 2; // Make it horizontal
        this.attackIndicator.position.copy(this.position);
        this.attackIndicator.position.y += 0.1; // Slightly above ground
        
        this.scene.add(this.attackIndicator);
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
                this.updateAttackIndicator();
                return; // Skip normal movement while knocked back
            }
        }
        
        // Update stun - NEW
        if (this.isStunned) {
            this.stunDuration -= deltaTime;
            if (this.stunDuration <= 0) {
                this.isStunned = false;
                // Reset attack state when recovering from stun
                this.isPreparingAttack = false;
                this.isAttacking = false;
                this.attackPreparationTimer = 0;
                this.attackTimer = 0;
                
                // Hide attack indicator
                if (this.attackIndicator) {
                    this.attackIndicator.material.opacity = 0;
                }
            } else {
                // Skip normal movement while stunned
                this.updateAttackIndicator();
                return;
            }
        }
        
        // Update attack cooldown - NEW
        if (this.attackCooldownTimer > 0) {
            this.attackCooldownTimer -= deltaTime;
        }
        
        // Check distance to player
        const distanceToPlayer = this.position.distanceTo(player.position);
        
        // Attack logic - NEW
        if (this.isChasing && distanceToPlayer < this.attackRange && this.attackCooldownTimer <= 0) {
            if (!this.isPreparingAttack && !this.isAttacking) {
                // Start preparing attack
                this.isPreparingAttack = true;
                this.attackPreparationTimer = this.attackPreparationTime;
                
                // Show attack indicator
                if (this.attackIndicator) {
                    this.attackIndicator.material.opacity = 0.5;
                }
            }
        }
        
        // Update attack preparation - NEW
        if (this.isPreparingAttack) {
            this.attackPreparationTimer -= deltaTime;
            
            // Gradually increase indicator opacity
            if (this.attackIndicator) {
                const progress = 1 - (this.attackPreparationTimer / this.attackPreparationTime);
                this.attackIndicator.material.opacity = 0.5 + (0.5 * progress);
                this.attackIndicator.scale.set(1 + progress, 1 + progress, 1);
            }
            
            if (this.attackPreparationTimer <= 0) {
                // Transition from preparation to attack
                this.isPreparingAttack = false;
                this.isAttacking = true;
                this.attackTimer = this.attackDuration;
                
                // Hide attack indicator
                if (this.attackIndicator) {
                    this.attackIndicator.material.opacity = 0;
                    this.attackIndicator.scale.set(1, 1, 1);
                }
            }
            
            // Don't move while preparing attack
            this.velocity.set(0, 0, 0);
        }
        // Update attack - NEW
        else if (this.isAttacking) {
            this.attackTimer -= deltaTime;
            
            if (this.attackTimer <= 0) {
                // Attack finished
                this.isAttacking = false;
                this.attackCooldownTimer = this.attackCooldown;
            }
            
            // Don't move while attacking
            this.velocity.set(0, 0, 0);
        }
        // Normal movement logic
        else if (distanceToPlayer < this.detectionRadius) {
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
        
        // Update attack indicator position
        this.updateAttackIndicator();
    }
    
    updateAttackIndicator() {
        if (this.attackIndicator) {
            this.attackIndicator.position.copy(this.position);
            this.attackIndicator.position.y += 0.1; // Slightly above ground
        }
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
        // Don't move if preparing to attack or attacking
        if (!this.isPreparingAttack && !this.isAttacking) {
            this.velocity.x = this.direction.x * this.moveSpeed;
            this.velocity.z = this.direction.z * this.moveSpeed;
        }
        
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
    
    takeDamage(damage) {
        if (this.isInvulnerable) return;
        
        this.health -= damage;
        this.isInvulnerable = true;
        this.invulnerabilityTimer = this.invulnerabilityTime;
        
        // Show damage effect
        this.showDamageEffect();
        
        // Apply stun when hit - NEW
        this.isStunned = true;
        this.stunDuration = this.stunTime;
        
        // Reset attack state when hit
        this.isPreparingAttack = false;
        this.isAttacking = false;
        
        // Hide attack indicator
        if (this.attackIndicator) {
            this.attackIndicator.material.opacity = 0;
            this.attackIndicator.scale.set(1, 1, 1);
        }
        
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
        // Skip if already dead
        if (this.isDead) return;
        
        this.isDead = true;
        
        // Play death sound
        this.assetLoader.playSound('enemyDeath');
        
        // Emit death event
        const deathEvent = new CustomEvent('enemyDeath', {
            detail: {
                position: this.mesh.position.clone(),
                score: 100
            }
        });
        document.dispatchEvent(deathEvent);
        
        // Create death particles based on quality
        if (this.scene.parent && this.scene.parent.quality) {
            const quality = this.scene.parent.quality;
            const particleCount = Math.floor(15 * quality.particleMultiplier);
            
            if (particleCount > 0) {
                // Create death particles
                for (let i = 0; i < particleCount; i++) {
                    const particle = new THREE.Mesh(
                        new THREE.SphereGeometry(0.1, 4, 4),
                        new THREE.MeshBasicMaterial({
                            color: 0xff0000,
                            transparent: true,
                            opacity: 0.8
                        })
                    );
                    
                    // Position particle at enemy position with slight randomness
                    particle.position.copy(this.mesh.position);
                    particle.position.x += (Math.random() - 0.5) * 0.5;
                    particle.position.y += (Math.random() - 0.5) * 0.5;
                    particle.position.z += (Math.random() - 0.5) * 0.5;
                    
                    // Store velocity for animation
                    particle.velocity = new THREE.Vector3(
                        (Math.random() - 0.5) * 0.3,
                        (Math.random() - 0.5) * 0.3 + 0.2, // Slight upward bias
                        (Math.random() - 0.5) * 0.3
                    );
                    
                    // Add to scene
                    this.scene.add(particle);
                    
                    // Animate and remove after a short time
                    const animateParticle = () => {
                        if (particle.material.opacity <= 0) {
                            this.scene.remove(particle);
                            particle.geometry.dispose();
                            particle.material.dispose();
                            return;
                        }
                        
                        particle.position.add(particle.velocity);
                        particle.material.opacity -= 0.02;
                        
                        requestAnimationFrame(animateParticle);
                    };
                    
                    animateParticle();
                }
            }
        }
        
        // Remove enemy from scene
        this.remove();
    }
    
    // Check if enemy is currently attacking - NEW
    isCurrentlyAttacking() {
        return this.isAttacking;
    }
    
    // Get attack damage - NEW
    getAttackDamage() {
        return this.attackDamage;
    }
} 