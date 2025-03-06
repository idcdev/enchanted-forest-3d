import * as THREE from 'three';

export class Player {
    constructor(scene, camera, inputHandler, assetLoader) {
        this.scene = scene;
        this.camera = camera;
        this.inputHandler = inputHandler;
        this.assetLoader = assetLoader;
        
        // Player state
        this.position = new THREE.Vector3(0, 2, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.direction = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0);
        this.isJumping = false;
        this.isGrounded = false;
        this.canDoubleJump = false;
        this.isInvulnerable = false;
        this.wasInAir = false;
        this.jumpRequested = false; // Track if jump was requested but not yet processed
        
        // Flight mechanics
        this.isFlying = false;
        this.maxFuel = 100;
        this.currentFuel = this.maxFuel;
        this.fuelConsumptionRate = 12; // Reduzido para consumir menos combustível
        this.fuelRegenerationRate = 8; // Aumentado para regenerar mais rápido
        this.flightForce = 12;        // Reduzido para um voo mais controlável
        this.flightSpeed = 7;         // Reduzido para um voo mais controlável
        this.canFly = true; // Whether player has enough fuel to fly
        this.flyingSoundPlaying = false;
        
        // Player stats
        this.moveSpeed = 5;
        this.jumpForce = 12; // Reduzido para um pulo mais controlável
        this.gravity = 22;   // Ajustado para uma queda mais natural
        
        // Dash properties
        this.isDashing = false;
        this.dashCooldown = 0;
        this.dashDuration = 0;
        this.dashDirection = new THREE.Vector3();
        this.dashSpeed = 30;
        this.dashCooldownTime = 1.5; // seconds
        this.dashDurationTime = 0.2; // seconds
        
        // Attack properties
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.attackDuration = 0;
        this.attackCooldownTime = 0.5; // seconds
        this.attackDurationTime = 0.3; // seconds
        this.attackDamage = 1;
        this.attackRange = 2.5;
        this.attackAngle = Math.PI / 2; // 90 degrees cone in front
        this.attackEffect = null;
        
        // Create player mesh
        this.createPlayerMesh();
        
        // Create collider
        this.collider = new THREE.Box3().setFromObject(this.mesh);
    }
    
    createPlayerMesh() {
        // For now, use a simple mesh as placeholder
        // In a full game, this would be replaced with a proper character model
        const geometry = new THREE.BoxGeometry(0.8, 1.6, 0.8);
        const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.position.copy(this.position);
        
        // Add a visual indicator for the front of the player
        const indicatorGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.5);
        const indicatorMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        this.frontIndicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        this.frontIndicator.position.set(0, 0, 0.5);
        this.mesh.add(this.frontIndicator);
        
        this.scene.add(this.mesh);
    }
    
    update(deltaTime) {
        // This method is now mostly handled by Game.update
        // It remains here for compatibility, but most functionality has been moved
        
        // Handle any player-specific updates that aren't handled by Game
        // For example, animations could be updated here
    }
    
    handleInput(deltaTime) {
        // Get input state
        const input = this.inputHandler.getInput();
        
        // Reset direction
        this.direction.set(0, 0, 0);
        
        // Handle attack input
        if (input.attack && this.attackCooldown <= 0 && !this.isAttacking) {
            this.performAttack();
        }
        
        // Update attack cooldown and duration
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        if (this.isAttacking) {
            this.attackDuration -= deltaTime;
            
            if (this.attackDuration <= 0) {
                this.isAttacking = false;
                this.removeAttackEffect();
            }
        }
        
        // Handle dash input
        if (input.action && this.dashCooldown <= 0 && !this.isDashing) {
            this.performDash();
        }
        
        // Update dash cooldown
        if (this.dashCooldown > 0) {
            this.dashCooldown -= deltaTime;
        }
        
        // If dashing, update dash duration and apply dash velocity
        if (this.isDashing) {
            this.dashDuration -= deltaTime;
            
            if (this.dashDuration <= 0) {
                this.isDashing = false;
                // Reset velocity after dash
                this.velocity.x *= 0.2;
                this.velocity.z *= 0.2;
            } else {
                // Apply dash velocity
                this.velocity.copy(this.dashDirection.multiplyScalar(this.dashSpeed));
                return; // Skip normal movement while dashing
            }
        }
        
        // Normal movement controls
        if (input.forward) this.direction.z -= 1;
        if (input.backward) this.direction.z += 1;
        if (input.left) this.direction.x -= 1;
        if (input.right) this.direction.x += 1;
        
        // Normalize direction vector
        if (this.direction.length() > 0) {
            this.direction.normalize();
        }
        
        // Calculate velocity based on direction and move speed
        const speed = input.sprint ? this.moveSpeed * 1.5 : this.moveSpeed;
        
        // Apply different speed if flying
        if (this.isFlying) {
            this.velocity.x = this.direction.x * this.flightSpeed;
            this.velocity.z = this.direction.z * this.flightSpeed;
        } else {
            this.velocity.x = this.direction.x * speed;
            this.velocity.z = this.direction.z * speed;
        }
        
        // Handle flying with space bar
        if (input.jump) {
            this.fly(deltaTime);
        } else {
            this.stopFlying(deltaTime);
        }
        
        // Update player rotation to face movement direction
        if (this.direction.length() > 0) {
            const targetRotation = Math.atan2(this.direction.x, this.direction.z);
            // Smoothly interpolate current rotation to target rotation
            const rotationSpeed = 10;
            const angleDiff = targetRotation - this.rotation.y;
            
            // Handle angle wrapping
            let shortestAngle = ((angleDiff + Math.PI) % (Math.PI * 2)) - Math.PI;
            
            this.rotation.y += shortestAngle * rotationSpeed * deltaTime;
        }
    }
    
    useSpecialAbility() {
        // This method is now replaced by the fly method
        console.log('Special ability used - Flight activated');
    }
    
    fly(deltaTime) {
        // Check if player has enough fuel to fly
        if (this.currentFuel > 0 && this.canFly) {
            // Activate flying state
            this.isFlying = true;
            
            // Apply upward force to counteract gravity and provide lift
            // Limit maximum upward velocity to prevent infinite ascent
            const maxUpwardVelocity = 7;
            const targetVelocity = this.flightForce * deltaTime * 15; // Reduced multiplier
            
            // Gradually approach target velocity for smoother flight
            this.velocity.y = Math.min(
                this.velocity.y + targetVelocity,
                maxUpwardVelocity
            );
            
            // Consume fuel
            this.currentFuel -= this.fuelConsumptionRate * deltaTime;
            
            // Create visual effect for flying
            this.showFlyingEffect();
            
            // Play flying sound if not already playing
            if (!this.flyingSoundPlaying) {
                this.assetLoader.playSound('fly', { loop: true });
                this.flyingSoundPlaying = true;
            }
            
            // If fuel is depleted, stop flying
            if (this.currentFuel <= 0) {
                this.currentFuel = 0;
                this.canFly = false;
                this.isFlying = false;
                this.stopFlying(deltaTime);
            }
        } else {
            this.isFlying = false;
            this.stopFlying(deltaTime);
        }
    }
    
    stopFlying(deltaTime) {
        // Stop flying sound if it was playing
        if (this.flyingSoundPlaying) {
            this.assetLoader.stopSound('fly');
            this.flyingSoundPlaying = false;
        }
        
        // Deactivate flying state
        this.isFlying = false;
        
        // Regenerate fuel when not flying
        if (this.currentFuel < this.maxFuel) {
            this.currentFuel += this.fuelRegenerationRate * deltaTime;
            
            // Cap fuel at maximum
            if (this.currentFuel >= this.maxFuel) {
                this.currentFuel = this.maxFuel;
                this.canFly = true;
            }
        }
    }
    
    showFlyingEffect() {
        // Create a simple particle effect for flying
        // This is a placeholder for a more sophisticated effect
        if (!this.flyingParticles) {
            const particleGeometry = new THREE.BufferGeometry();
            const particleCount = 20;
            const positions = new Float32Array(particleCount * 3);
            
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                positions[i3] = (Math.random() - 0.5) * 0.5;
                positions[i3 + 1] = -0.8; // Below the player
                positions[i3 + 2] = (Math.random() - 0.5) * 0.5;
            }
            
            particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            const particleMaterial = new THREE.PointsMaterial({
                color: 0x88ccff,
                size: 0.1,
                transparent: true,
                opacity: 0.8
            });
            
            this.flyingParticles = new THREE.Points(particleGeometry, particleMaterial);
            this.mesh.add(this.flyingParticles);
        }
        
        // Make particles visible
        if (this.flyingParticles) {
            this.flyingParticles.visible = true;
        }
    }
    
    hideFlyingEffect() {
        // Hide flying particles
        if (this.flyingParticles) {
            this.flyingParticles.visible = false;
        }
    }
    
    checkGrounded() {
        // Simple ground check - only checks against the absolute ground level
        // Does NOT reposition the player, only sets the grounded state
        // Platform collisions are handled by Level.checkPlatformCollisions
        const playerHeight = 1.6;
        const playerBottom = this.position.y - playerHeight / 2;
        
        if (playerBottom <= 0.05 && this.velocity.y <= 0) {
            // Player is on the ground
            this.position.y = 0.8; // Set to exact ground level (playerHeight/2)
            this.isGrounded = true;
            this.isJumping = false;
            this.velocity.y = 0;
            
            // If we just landed, play landing sound
            if (this.wasInAir) {
                this.assetLoader.playSound('land');
                this.wasInAir = false;
            }
        } else if (playerBottom > 0.05) {
            // Player is above ground level and not on a platform
            this.isGrounded = false;
            this.wasInAir = true;
        }
    }
    
    updateCollider() {
        this.collider.setFromObject(this.mesh);
    }
    
    getCollider() {
        return this.collider;
    }
    
    applyKnockback(direction) {
        this.velocity.add(direction);
        
        // Make player briefly invulnerable after knockback
        if (!this.isInvulnerable) {
            this.isInvulnerable = true;
            
            // Flash effect to indicate invulnerability
            this.showInvulnerabilityEffect();
            
            // Reset invulnerability after a delay
            setTimeout(() => {
                this.isInvulnerable = false;
                this.mesh.material.opacity = 1;
                this.mesh.material.transparent = false;
            }, 1000);
        }
    }
    
    showDamageEffect() {
        // Flash red to indicate damage
        const originalColor = this.mesh.material.color.clone();
        this.mesh.material.color.set(0xff0000);
        
        // Play damage sound
        this.assetLoader.playSound('damage');
        
        setTimeout(() => {
            this.mesh.material.color.copy(originalColor);
        }, 200);
    }
    
    showInvulnerabilityEffect() {
        // Make player semi-transparent and flash
        this.mesh.material.transparent = true;
        
        const flashInterval = setInterval(() => {
            this.mesh.material.opacity = this.mesh.material.opacity === 1 ? 0.5 : 1;
        }, 100);
        
        setTimeout(() => {
            clearInterval(flashInterval);
        }, 1000);
    }
    
    reset() {
        // Reset position and state
        this.position.set(0, 2, 0);
        this.velocity.set(0, 0, 0);
        this.direction.set(0, 0, 0);
        this.rotation.set(0, 0, 0);
        this.isJumping = false;
        this.isGrounded = false;
        this.canDoubleJump = false;
        this.isInvulnerable = false;
        this.wasInAir = false;
        this.jumpRequested = false;
        
        // Reset flight mechanics
        this.isFlying = false;
        this.currentFuel = this.maxFuel;
        this.canFly = true;
        this.flyingSoundPlaying = false;
        
        // Stop any player sounds
        this.assetLoader.stopSound('fly');
        
        // Update mesh
        this.mesh.position.copy(this.position);
        this.mesh.rotation.copy(this.rotation);
        
        // Reset material
        this.mesh.material.opacity = 1;
        this.mesh.material.transparent = false;
        this.mesh.material.color.set(0x00ff00);
        
        // Hide flying effect
        this.hideFlyingEffect();
    }
    
    // Add new method for dash
    performDash() {
        this.isDashing = true;
        this.dashDuration = this.dashDurationTime;
        this.dashCooldown = this.dashCooldownTime;
        
        // Set dash direction based on current input
        const input = this.inputHandler.getInput();
        this.dashDirection.set(0, 0, 0);
        
        if (input.forward) this.dashDirection.z -= 1;
        if (input.backward) this.dashDirection.z += 1;
        if (input.left) this.dashDirection.x -= 1;
        if (input.right) this.dashDirection.x += 1;
        
        // If no direction input, dash forward
        if (this.dashDirection.length() === 0) {
            this.dashDirection.z = -1;
        }
        
        // Normalize direction
        this.dashDirection.normalize();
        
        // Apply camera rotation to dash direction
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        cameraDirection.y = 0;
        cameraDirection.normalize();
        
        const dashQuat = new THREE.Quaternion();
        dashQuat.setFromUnitVectors(new THREE.Vector3(0, 0, -1), cameraDirection);
        this.dashDirection.applyQuaternion(dashQuat);
        
        // Show dash effect
        this.showDashEffect();
    }
    
    showDashEffect() {
        // Create a simple dash effect with particles
        const particleCount = 20;
        const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff,
            transparent: true,
            opacity: 0.7
        });
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(this.mesh.position);
            
            // Add random offset
            particle.position.x += (Math.random() - 0.5) * 0.5;
            particle.position.y += (Math.random() - 0.5) * 0.5;
            particle.position.z += (Math.random() - 0.5) * 0.5;
            
            this.scene.add(particle);
            
            // Animate and remove particle
            const direction = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ).normalize();
            
            // Use setTimeout for simple animation
            const animateParticle = () => {
                particle.position.add(direction.multiplyScalar(-0.1));
                particle.material.opacity -= 0.05;
                
                if (particle.material.opacity <= 0) {
                    this.scene.remove(particle);
                    return;
                }
                
                requestAnimationFrame(animateParticle);
            };
            
            animateParticle();
        }
    }
    
    // Add new method for attack
    performAttack() {
        this.isAttacking = true;
        this.attackDuration = this.attackDurationTime;
        this.attackCooldown = this.attackCooldownTime;
        
        // Play attack sound
        this.assetLoader.playSound('attackSwing');
        
        // Show attack effect
        this.showAttackEffect();
        
        // Get camera direction for attack direction
        const attackDirection = new THREE.Vector3();
        this.camera.getWorldDirection(attackDirection);
        attackDirection.y = 0;
        attackDirection.normalize();
        
        // Check for enemies in attack range and angle
        // This would need to be implemented in the Game class to check collisions with enemies
        // For now, we'll just show the visual effect
        
        // Emit attack event that Game class can listen for
        const attackEvent = new CustomEvent('playerAttack', {
            detail: {
                position: this.mesh.position.clone(),
                direction: attackDirection,
                range: this.attackRange,
                angle: this.attackAngle,
                damage: this.attackDamage
            }
        });
        window.dispatchEvent(attackEvent);
    }
    
    showAttackEffect() {
        // Create a cone to represent the attack area
        const coneGeometry = new THREE.ConeGeometry(this.attackRange, this.attackRange, 32);
        const coneMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.3
        });
        
        // Create the attack effect mesh
        this.attackEffect = new THREE.Mesh(coneGeometry, coneMaterial);
        
        // Position and rotate the cone to match the player's position and facing direction
        this.attackEffect.position.copy(this.mesh.position);
        this.attackEffect.position.y += 0.5; // Raise slightly above ground
        
        // Rotate the cone to point forward (cone points up by default)
        this.attackEffect.rotation.x = Math.PI / 2;
        
        // Get camera direction for attack direction
        const attackDirection = new THREE.Vector3();
        this.camera.getWorldDirection(attackDirection);
        attackDirection.y = 0;
        attackDirection.normalize();
        
        // Create a quaternion to rotate the cone to face the camera direction
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), attackDirection);
        
        // Apply the quaternion to the cone's rotation
        this.attackEffect.quaternion.premultiply(quaternion);
        
        // Add the attack effect to the scene
        this.scene.add(this.attackEffect);
        
        // Create particle effect for the attack
        const particleCount = 15;
        const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0xff5500,
            transparent: true,
            opacity: 0.7
        });
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Position particle at the player's position
            particle.position.copy(this.mesh.position);
            
            // Calculate a random position within the attack cone
            const angle = (Math.random() - 0.5) * this.attackAngle;
            const distance = Math.random() * this.attackRange;
            
            // Create a direction vector based on the camera direction and random angle
            const particleDirection = attackDirection.clone();
            
            // Create a rotation axis perpendicular to the attack direction
            const rotationAxis = new THREE.Vector3(0, 1, 0);
            
            // Rotate the particle direction around the rotation axis by the random angle
            particleDirection.applyAxisAngle(rotationAxis, angle);
            
            // Move the particle along the direction by the random distance
            particle.position.add(particleDirection.multiplyScalar(distance));
            
            // Add some height variation
            particle.position.y += 0.5 + Math.random() * 0.5;
            
            this.scene.add(particle);
            
            // Animate and remove particle
            const animateParticle = () => {
                particle.material.opacity -= 0.05;
                
                if (particle.material.opacity <= 0) {
                    this.scene.remove(particle);
                    return;
                }
                
                requestAnimationFrame(animateParticle);
            };
            
            animateParticle();
        }
    }
    
    removeAttackEffect() {
        if (this.attackEffect) {
            this.scene.remove(this.attackEffect);
            this.attackEffect = null;
        }
    }
} 