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
        
        // Player class
        this.playerClass = 'warrior'; // Default class
        this.projectiles = []; // For archer and mage
        
        // Flying properties
        this.isFlying = false;
        this.fuel = 100;
        this.maxFuel = 100;
        this.fuelConsumptionRate = 15;
        this.fuelRegenerationRate = 8; // Aumentado para regenerar mais rápido
        this.flightForce = 12;        // Reduzido para um voo mais controlável
        this.flightSpeed = 7;         // Reduzido para um voo mais controlável
        this.canFly = true; // Whether player has enough fuel to fly
        this.flyingSoundPlaying = false;
        
        // Player stats (will be adjusted based on class)
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
        // Limit deltaTime to prevent physics issues on slow devices
        const cappedDeltaTime = Math.min(deltaTime, 0.1);
        
        // Handle input and apply gravity
        this.handleInput(cappedDeltaTime);
        
        // Apply gravity only if not flying
        if (!this.isGrounded && !this.isFlying) {
            // Apply gravity with a smoother effect
            this.velocity.y -= this.gravity * cappedDeltaTime;
        } else if (this.isFlying) {
            // Apply a small amount of gravity even when flying to make it feel more natural
            // This creates resistance that the player must overcome
            this.velocity.y -= (this.gravity * 0.15) * cappedDeltaTime;
        }
        
        // Clamp velocity to prevent extreme values
        const maxVelocity = 20;
        this.velocity.x = Math.max(Math.min(this.velocity.x, maxVelocity), -maxVelocity);
        this.velocity.y = Math.max(Math.min(this.velocity.y, maxVelocity), -maxVelocity);
        this.velocity.z = Math.max(Math.min(this.velocity.z, maxVelocity), -maxVelocity);
        
        // Store previous position for collision detection
        const previousPosition = this.position.clone();
        
        // Update position based on velocity
        this.position.x += this.velocity.x * cappedDeltaTime;
        this.position.y += this.velocity.y * cappedDeltaTime;
        this.position.z += this.velocity.z * cappedDeltaTime;
        
        // Prevent falling through the world - safety check
        if (this.position.y < -10) {
            this.position.set(0, 5, 0); // Reset to a safe position above the ground
            this.velocity.set(0, 0, 0);
        }
        
        // Check for ground collision first (only if not flying)
        if (!this.isFlying) {
            this.checkGrounded();
        }
        
        // Update mesh and collider
        this.mesh.position.copy(this.position);
        this.mesh.rotation.copy(this.rotation);
        this.updateCollider();
        
        // Update projectiles
        this.updateProjectiles(cappedDeltaTime);
        
        // Apply damping to velocity
        this.velocity.x *= 0.9;
        this.velocity.z *= 0.9;
        
        // Regenerate fuel when not flying
        if (!this.isFlying && this.fuel < this.maxFuel) {
            this.fuel = Math.min(this.fuel + this.fuelRegenerationRate * cappedDeltaTime, this.maxFuel);
            this.canFly = true;
        }
        
        // Reduce dash cooldown
        if (this.dashCooldown > 0) {
            this.dashCooldown -= cappedDeltaTime;
        }
        
        // Handle dash duration
        if (this.isDashing) {
            this.dashDuration -= cappedDeltaTime;
            if (this.dashDuration <= 0) {
                this.isDashing = false;
            }
        }
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
        if (this.fuel > 0 && this.canFly) {
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
            this.fuel -= this.fuelConsumptionRate * deltaTime;
            
            // Create visual effect for flying
            this.showFlyingEffect();
            
            // Play flying sound if not already playing
            if (!this.flyingSoundPlaying) {
                this.assetLoader.playSound('fly', { loop: true });
                this.flyingSoundPlaying = true;
            }
            
            // If fuel is depleted, stop flying
            if (this.fuel <= 0) {
                this.fuel = 0;
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
        if (this.fuel < this.maxFuel) {
            this.fuel += this.fuelRegenerationRate * deltaTime;
            
            // Cap fuel at maximum
            if (this.fuel >= this.maxFuel) {
                this.fuel = this.maxFuel;
                this.canFly = true;
            }
        }
    }
    
    showFlyingEffect() {
        // Skip effect on low quality
        if (!this.scene.parent || !this.scene.parent.quality) return;
        
        const quality = this.scene.parent.quality;
        
        // Create flying particles if they don't exist
        if (!this.flyingParticles) {
            // Number of particles based on quality
            const particleCount = Math.floor(50 * quality.particleMultiplier);
            
            const particleGeometry = new THREE.BufferGeometry();
            const particlePositions = new Float32Array(particleCount * 3);
            
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                particlePositions[i3] = (Math.random() - 0.5) * 0.5;
                particlePositions[i3 + 1] = (Math.random() - 0.5) * 0.5 - 0.5; // Below player
                particlePositions[i3 + 2] = (Math.random() - 0.5) * 0.5;
            }
            
            particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
            
            const particleMaterial = new THREE.PointsMaterial({
                color: 0x3f51b5,
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
        this.makeInvulnerable(1.0); // 1 second of invulnerability
    }
    
    // Make player invulnerable for a specified duration - NEW
    makeInvulnerable(duration) {
        if (!this.isInvulnerable) {
            this.isInvulnerable = true;
            
            // Flash effect to indicate invulnerability
            this.showInvulnerabilityEffect();
            
            // Reset invulnerability after the specified duration
            setTimeout(() => {
                this.isInvulnerable = false;
                this.hideInvulnerabilityEffect();
            }, duration * 1000);
        }
    }
    
    showDamageEffect() {
        // Flash red to indicate damage
        const originalMaterial = this.mesh.material.clone();
        this.mesh.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        
        // Reset material after a short delay
        setTimeout(() => {
            this.mesh.material = originalMaterial;
        }, 200);
    }
    
    showInvulnerabilityEffect() {
        // Make player semi-transparent and add flashing effect
        this.mesh.material.transparent = true;
        
        // Start flashing effect
        this.invulnerabilityFlashInterval = setInterval(() => {
            // Toggle between semi-transparent and more visible
            this.mesh.material.opacity = this.mesh.material.opacity < 0.5 ? 0.8 : 0.3;
        }, 150); // Flash every 150ms
    }
    
    hideInvulnerabilityEffect() {
        // Stop flashing effect
        if (this.invulnerabilityFlashInterval) {
            clearInterval(this.invulnerabilityFlashInterval);
            this.invulnerabilityFlashInterval = null;
        }
        
        // Reset material
        this.mesh.material.transparent = false;
        this.mesh.material.opacity = 1.0;
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
        this.fuel = this.maxFuel;
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
        // Skip effect on low quality
        if (!this.scene.parent || !this.scene.parent.quality) return;
        
        const quality = this.scene.parent.quality;
        
        // Create a simple dash effect with particles
        const particleCount = Math.floor(20 * quality.particleMultiplier);
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 4, 4),
                new THREE.MeshBasicMaterial({
                    color: 0x3f51b5,
                    transparent: true,
                    opacity: 0.8
                })
            );
            
            // Position particle at player's position with slight randomness
            particle.position.copy(this.position);
            particle.position.x += (Math.random() - 0.5) * 0.5;
            particle.position.y += (Math.random() - 0.5) * 0.5;
            particle.position.z += (Math.random() - 0.5) * 0.5;
            
            // Store velocity for animation
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.2 - this.dashDirection.x * 0.3,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2 - this.dashDirection.z * 0.3
            );
            
            // Add to scene
            this.scene.add(particle);
            particles.push(particle);
            
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
    
    // Add new method for attack
    performAttack() {
        this.isAttacking = true;
        this.attackDuration = this.attackDurationTime;
        this.attackCooldown = this.attackCooldownTime;
        
        // Play attack sound based on class
        switch (this.playerClass) {
            case 'warrior':
                this.assetLoader.playSound('swordSwing');
                break;
            case 'archer':
                this.assetLoader.playSound('bowShot');
                break;
            case 'mage':
                this.assetLoader.playSound('magicCast');
                break;
            default:
                this.assetLoader.playSound('attackSwing');
        }
        
        // Get camera direction for attack direction
        const attackDirection = new THREE.Vector3();
        this.camera.getWorldDirection(attackDirection);
        attackDirection.y = 0;
        attackDirection.normalize();
        
        // Perform class-specific attack
        switch (this.playerClass) {
            case 'warrior':
                this.performWarriorAttack(attackDirection);
                break;
            case 'archer':
                this.performArcherAttack(attackDirection);
                break;
            case 'mage':
                this.performMageAttack(attackDirection);
                break;
        }
        
        // Emit attack event that Game class can listen for
        const attackEvent = new CustomEvent('playerAttack', {
            detail: {
                position: this.mesh.position.clone(),
                direction: attackDirection,
                range: this.attackRange,
                angle: this.attackAngle,
                damage: this.attackDamage,
                playerClass: this.playerClass
            }
        });
        window.dispatchEvent(attackEvent);
    }
    
    performWarriorAttack(direction) {
        // Create a sword slash effect
        this.showSwordEffect(direction);
    }
    
    performArcherAttack(direction) {
        // Create and shoot an arrow
        this.shootArrow(direction);
    }
    
    performMageAttack(direction) {
        // Create a magic area effect
        this.castSpell(direction);
    }
    
    showSwordEffect(direction) {
        // Create a sword slash mesh
        const slashGeometry = new THREE.TorusGeometry(2, 0.2, 8, 16, Math.PI);
        const slashMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        this.attackEffect = new THREE.Mesh(slashGeometry, slashMaterial);
        
        // Position the slash in front of the player
        this.attackEffect.position.copy(this.mesh.position);
        this.attackEffect.position.y += 0.5;
        
        // Rotate to face the direction
        this.attackEffect.lookAt(this.mesh.position.clone().add(direction));
        this.attackEffect.rotateX(Math.PI / 2);
        
        // Add to scene
        this.scene.add(this.attackEffect);
        
        // Animate the slash
        const startTime = Date.now();
        const duration = this.attackDurationTime * 1000;
        
        const animateSlash = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                // Rotate the slash for a sweeping effect
                this.attackEffect.rotation.z = Math.PI * 2 * progress;
                this.attackEffect.material.opacity = 0.7 * (1 - progress);
                
                requestAnimationFrame(animateSlash);
            } else {
                // Remove the slash
                this.scene.remove(this.attackEffect);
                this.attackEffect = null;
            }
        };
        
        animateSlash();
    }
    
    shootArrow(direction) {
        // Create arrow geometry
        const arrowGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
        const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
        const arrowMesh = new THREE.Mesh(arrowGeometry, arrowMaterial);
        
        // Rotate arrow to point in direction
        arrowMesh.rotation.x = Math.PI / 2;
        
        // Position arrow at player position
        arrowMesh.position.copy(this.mesh.position);
        arrowMesh.position.y += 0.5;
        
        // Move arrow slightly forward
        arrowMesh.position.add(direction.clone().multiplyScalar(1));
        
        // Add to scene
        this.scene.add(arrowMesh);
        
        // Create projectile object
        const arrow = {
            mesh: arrowMesh,
            position: arrowMesh.position,
            velocity: direction.clone().multiplyScalar(20),
            lifetime: 2,
            damage: this.attackDamage,
            type: 'arrow'
        };
        
        // Add to projectiles array
        this.projectiles.push(arrow);
        
        // Create trail effect
        this.createProjectileTrail(arrow, 0x4caf50);
    }
    
    castSpell(direction) {
        // Create spell orb
        const spellGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const spellMaterial = new THREE.MeshBasicMaterial({
            color: 0x3f51b5,
            transparent: true,
            opacity: 0.8
        });
        const spellMesh = new THREE.Mesh(spellGeometry, spellMaterial);
        
        // Position spell at player position
        spellMesh.position.copy(this.mesh.position);
        spellMesh.position.y += 0.5;
        
        // Move spell slightly forward
        spellMesh.position.add(direction.clone().multiplyScalar(1));
        
        // Add to scene
        this.scene.add(spellMesh);
        
        // Create projectile object
        const spell = {
            mesh: spellMesh,
            position: spellMesh.position,
            velocity: direction.clone().multiplyScalar(15),
            lifetime: 1.5,
            damage: this.attackDamage,
            type: 'spell'
        };
        
        // Add to projectiles array
        this.projectiles.push(spell);
        
        // Create trail effect
        this.createProjectileTrail(spell, 0x3f51b5);
        
        // Add point light to spell
        const light = new THREE.PointLight(0x3f51b5, 1, 3);
        spellMesh.add(light);
    }
    
    createProjectileTrail(projectile, color) {
        // Create trail particles
        const createTrailParticle = () => {
            const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.5
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(projectile.position);
            
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
        };
        
        // Create trail particles at intervals
        const trailInterval = setInterval(() => {
            if (projectile.lifetime <= 0) {
                clearInterval(trailInterval);
                return;
            }
            
            createTrailParticle();
        }, 50);
    }
    
    removeAttackEffect() {
        if (this.attackEffect) {
            this.scene.remove(this.attackEffect);
            this.attackEffect = null;
        }
    }
    
    // Add method to set player class
    setClass(className) {
        this.playerClass = className;
        
        // Update player stats based on class
        switch (className) {
            case 'warrior':
                this.moveSpeed = 4.5;
                this.attackDamage = 2;
                this.attackRange = 2.5;
                this.attackCooldownTime = 0.6;
                this.attackAngle = Math.PI / 3; // 60 degrees cone
                break;
            case 'archer':
                this.moveSpeed = 6;
                this.attackDamage = 1;
                this.attackRange = 15;
                this.attackCooldownTime = 0.4;
                this.attackAngle = Math.PI / 12; // 15 degrees cone (narrow)
                break;
            case 'mage':
                this.moveSpeed = 4;
                this.attackDamage = 1.5;
                this.attackRange = 8;
                this.attackCooldownTime = 0.8;
                this.attackAngle = Math.PI; // 180 degrees cone (wide area)
                break;
        }
        
        // Update player appearance based on class
        this.updatePlayerAppearance();
    }
    
    updatePlayerAppearance() {
        // Remove existing mesh
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        
        // Create new mesh based on class
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        let material;
        
        switch (this.playerClass) {
            case 'warrior':
                material = new THREE.MeshStandardMaterial({ color: 0xf44336 }); // Red
                break;
            case 'archer':
                material = new THREE.MeshStandardMaterial({ color: 0x4caf50 }); // Green
                break;
            case 'mage':
                material = new THREE.MeshStandardMaterial({ color: 0x3f51b5 }); // Blue
                break;
            default:
                material = new THREE.MeshStandardMaterial({ color: 0xffffff }); // White
        }
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
        
        // Update collider
        this.updateCollider();
    }
    
    updateProjectiles(deltaTime) {
        // Update existing projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Move projectile
            projectile.position.add(projectile.velocity.clone().multiplyScalar(deltaTime));
            
            // Update lifetime
            projectile.lifetime -= deltaTime;
            
            // Remove if lifetime is over
            if (projectile.lifetime <= 0) {
                this.scene.remove(projectile.mesh);
                this.projectiles.splice(i, 1);
            }
        }
    }
} 