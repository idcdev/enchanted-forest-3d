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
        
        // Calculate movement direction
        this.direction.set(0, 0, 0);
        
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
        
        // Handle jumping - simples, apenas quando a tecla é pressionada
        if (input.jump && this.isGrounded && !this.jumpRequested) {
            this.jumpRequested = true;
            this.jump();
        } else if (!input.jump) {
            // Reset jump request when key is released
            this.jumpRequested = false;
        }
        
        // Handle flying
        if (input.action) {
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
    
    jump() {
        // Simplificado: se não estiver voando, aplicar um impulso vertical forte
        if (!this.isFlying) {
            // Aplicar um impulso vertical forte e imediato
            this.velocity.y = this.jumpForce;
            this.isJumping = true;
            this.isGrounded = false;
            
            // Garantir que o jogador saia do chão imediatamente
            this.position.y += 0.3;
            
            // Tocar som de pulo
            this.assetLoader.playSound('jump');
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
} 