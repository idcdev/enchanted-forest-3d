import * as THREE from 'three';
import { Physics } from '../utils/Physics.js';
import { LevelManager } from '../utils/LevelManager.js';

export class Game {
    constructor(scene, camera, player, ui, inputHandler, assetLoader) {
        this.scene = scene;
        this.camera = camera;
        this.player = player;
        this.ui = ui;
        this.inputHandler = inputHandler;
        this.assetLoader = assetLoader;
        
        // Game state
        this.state = {
            isPlaying: true,
            isPaused: false,
            isGameOver: false,
            isLevelComplete: false,
            score: {
                crystals: 0,
                seeds: 0
            },
            health: 100
        };
        
        // Setup physics
        this.physics = new Physics();
        
        // Setup level manager
        this.levelManager = new LevelManager(scene, assetLoader);
        this.levelManager.loadLevel(0); // Load first level
        
        // Get current level
        this.level = this.levelManager.getCurrentLevel();
        
        // Setup clock for delta time
        this.clock = new THREE.Clock();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Show level info
        this.showLevelInfo();
    }
    
    setupEventListeners() {
        // Restart button
        document.getElementById('restart-button').addEventListener('click', () => {
            // Play button click sound
            this.player.assetLoader.playSound('buttonClick');
            this.restartGame();
        });
        
        // Next level button
        document.getElementById('next-level-button').addEventListener('click', () => {
            // Play button click sound
            this.player.assetLoader.playSound('buttonClick');
            this.nextLevel();
        });
        
        // Resume button
        document.getElementById('resume-button').addEventListener('click', () => {
            // Play button click sound
            this.player.assetLoader.playSound('buttonClick');
            this.togglePause();
        });
        
        // Pause game on 'Escape' key
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.togglePause();
            }
        });
        
        // Listen for player attack events
        window.addEventListener('playerAttack', (event) => {
            this.handlePlayerAttack(event.detail);
        });
        
        // Listen for enemy death events
        window.addEventListener('enemyDeath', (event) => {
            this.handleEnemyDeath(event.detail);
        });
    }
    
    showLevelInfo() {
        const levelInfo = this.levelManager.getCurrentLevelInfo();
        this.ui.showMessage(`Nível: ${levelInfo.name} - ${levelInfo.difficulty}`, 5000);
    }
    
    update(deltaTime) {
        if (this.state.isPaused || this.state.isGameOver || this.state.isLevelComplete) {
            return;
        }
        
        // Limit deltaTime to prevent physics issues on slow devices
        const cappedDeltaTime = Math.min(deltaTime, 0.1);
        
        // Update physics
        this.physics.update(cappedDeltaTime);
        
        // Update player input and apply gravity
        this.player.handleInput(cappedDeltaTime);
        
        // Apply gravity only if not flying
        if (!this.player.isGrounded && !this.player.isFlying) {
            // Apply gravity with a smoother effect
            this.player.velocity.y -= this.player.gravity * cappedDeltaTime;
        } else if (this.player.isFlying) {
            // Apply a small amount of gravity even when flying to make it feel more natural
            // This creates resistance that the player must overcome
            this.player.velocity.y -= (this.player.gravity * 0.15) * cappedDeltaTime;
        }
        
        // Clamp velocity to prevent extreme values
        const maxVelocity = 20;
        this.player.velocity.x = Math.max(Math.min(this.player.velocity.x, maxVelocity), -maxVelocity);
        this.player.velocity.y = Math.max(Math.min(this.player.velocity.y, maxVelocity), -maxVelocity);
        this.player.velocity.z = Math.max(Math.min(this.player.velocity.z, maxVelocity), -maxVelocity);
        
        // Store previous position for collision detection
        const previousPosition = this.player.position.clone();
        
        // Update player position based on velocity
        this.player.position.x += this.player.velocity.x * cappedDeltaTime;
        this.player.position.y += this.player.velocity.y * cappedDeltaTime;
        this.player.position.z += this.player.velocity.z * cappedDeltaTime;
        
        // Prevent falling through the world - safety check
        if (this.player.position.y < -10) {
            this.player.position.set(0, 5, 0); // Reset to a safe position above the ground
            this.player.velocity.set(0, 0, 0);
        }
        
        // Check for ground collision first (only if not flying)
        if (!this.player.isFlying) {
            this.player.checkGrounded();
        }
        
        // Check platform collisions (only if not flying)
        if (!this.player.isFlying) {
            this.level.checkPlatformCollisions(this.player);
        }
        
        // Check obstacle collisions (trees, mushrooms, etc.)
        this.level.checkObstacleCollisions(this.player);
        
        // Update player mesh and collider
        this.player.mesh.position.copy(this.player.position);
        this.player.mesh.rotation.copy(this.player.rotation);
        this.player.updateCollider();
        
        // Update level (enemies, collectibles, etc.)
        this.level.update(cappedDeltaTime, this.player);
        
        // Check other collisions (collectibles, enemies)
        this.checkCollisions();
        
        // Update camera to follow player
        this.updateCamera();
        
        // Update UI
        this.updateUI();
        
        // Check game conditions
        this.checkGameConditions();
    }
    
    checkCollisions() {
        // Check player collision with collectibles
        const collectibles = this.level.getCollectibles();
        for (let i = collectibles.length - 1; i >= 0; i--) {
            const collectible = collectibles[i];
            if (this.physics.checkCollision(this.player.getCollider(), collectible.getCollider())) {
                // Handle collectible pickup
                if (collectible.type === 'crystal') {
                    this.state.score.crystals++;
                    // Play crystal collection sound
                    this.player.assetLoader.playSound('collectCrystal');
                } else if (collectible.type === 'seed') {
                    this.state.score.seeds++;
                    // Play seed collection sound
                    this.player.assetLoader.playSound('collectSeed');
                }
                
                // Remove collectible from scene
                this.level.removeCollectible(i);
            }
        }
        
        // Check player collision with enemies
        const enemies = this.level.getEnemies();
        for (const enemy of enemies) {
            if (this.physics.checkCollision(this.player.getCollider(), enemy.getCollider())) {
                // Handle enemy collision
                this.damagePlayer(10);
                
                // Knockback player
                const knockbackDirection = new THREE.Vector3()
                    .subVectors(this.player.position, enemy.position)
                    .normalize()
                    .multiplyScalar(5);
                this.player.applyKnockback(knockbackDirection);
                
                // Play enemy attack sound
                this.player.assetLoader.playSound('enemyAttack');
            }
        }
        
        // Check player collision with level boundaries
        if (this.player.position.y < -10) {
            this.damagePlayer(100); // Player fell off the level
        }
    }
    
    updateCamera() {
        // Camera follows player with smooth lerping
        let targetPosition;
        
        if (this.player.isFlying) {
            // When flying, position camera higher and further back for better view
            targetPosition = new THREE.Vector3(
                this.player.position.x,
                this.player.position.y + 8, // Higher camera position during flight
                this.player.position.z + 15 // Further back during flight
            );
        } else {
            // Normal camera position
            targetPosition = new THREE.Vector3(
                this.player.position.x,
                this.player.position.y + 5,
                this.player.position.z + 10
            );
        }
        
        this.camera.position.lerp(targetPosition, 0.1);
        this.camera.lookAt(this.player.position);
    }
    
    updateUI() {
        // Update score display
        this.ui.updateScore(this.state.score.crystals, this.state.score.seeds);
        
        // Update health bar
        this.ui.updateHealth(this.state.health);
        
        // Update fuel bar (new)
        this.ui.updateFuel(this.player.currentFuel, this.player.maxFuel);
    }
    
    checkGameConditions() {
        // Check if player has collected all crystals
        if (this.state.score.crystals >= this.level.getTotalCrystals()) {
            this.levelComplete();
        }
        
        // Check if player is dead
        if (this.state.health <= 0) {
            this.gameOver();
        }
    }
    
    damagePlayer(amount) {
        this.state.health = Math.max(0, this.state.health - amount);
        
        // Visual feedback for damage
        this.player.showDamageEffect();
    }
    
    togglePause() {
        this.state.isPaused = !this.state.isPaused;
        
        // Show/hide pause menu
        const pauseMenu = document.getElementById('pause-menu');
        if (this.state.isPaused) {
            pauseMenu.style.display = 'flex';
            // Play pause sound
            this.player.assetLoader.playSound('buttonClick');
            // Stop the clock
            this.clock.stop();
        } else {
            pauseMenu.style.display = 'none';
            // Play resume sound
            this.player.assetLoader.playSound('buttonClick');
            // Start the clock
            this.clock.start();
        }
        
        // Show message
        if (this.state.isPaused) {
            this.ui.showMessage("Game Paused", 2000);
        } else {
            this.ui.showMessage("Game Resumed", 2000);
        }
    }
    
    gameOver() {
        this.state.isGameOver = true;
        
        // Play game over sound
        this.player.assetLoader.playSound('gameOver');
        
        // Show game over screen
        document.getElementById('game-over').classList.add('active');
    }
    
    levelComplete() {
        this.state.isLevelComplete = true;
        
        // Play level complete sound
        this.player.assetLoader.playSound('levelComplete');
        
        // Update final score display
        document.getElementById('final-crystals').textContent = this.state.score.crystals;
        document.getElementById('final-seeds').textContent = this.state.score.seeds;
        
        // Show level complete screen
        document.getElementById('level-complete').classList.add('active');
    }
    
    restartGame() {
        // Reset game state
        this.state.isPlaying = true;
        this.state.isPaused = false;
        this.state.isGameOver = false;
        this.state.isLevelComplete = false;
        this.state.score.crystals = 0;
        this.state.score.seeds = 0;
        this.state.health = 100;
        
        // Reset player
        this.player.reset();
        
        // Reset level
        this.levelManager.resetCurrentLevel();
        this.level = this.levelManager.getCurrentLevel();
        
        // Hide overlays
        document.getElementById('game-over').classList.remove('active');
        document.getElementById('level-complete').classList.remove('active');
        
        // Restart clock
        this.clock.start();
        
        // Show level info
        this.showLevelInfo();
    }
    
    nextLevel() {
        // Reset game state
        this.state.isPlaying = true;
        this.state.isPaused = false;
        this.state.isGameOver = false;
        this.state.isLevelComplete = false;
        this.state.score.crystals = 0;
        this.state.score.seeds = 0;
        this.state.health = 100;
        
        // Reset player
        this.player.reset();
        
        // Load next level
        this.levelManager.loadNextLevel();
        this.level = this.levelManager.getCurrentLevel();
        
        // Hide overlays
        document.getElementById('level-complete').classList.remove('active');
        
        // Restart clock
        this.clock.start();
        
        // Show level info
        this.showLevelInfo();
    }
    
    // Add new method to handle player attacks
    handlePlayerAttack(attackData) {
        if (this.state.isPaused || this.state.isGameOver || this.state.isLevelComplete) {
            return;
        }
        
        const enemies = this.level.getEnemies();
        const playerPosition = attackData.position;
        const attackDirection = attackData.direction;
        const attackRange = attackData.range;
        const attackAngle = attackData.angle;
        const attackDamage = attackData.damage;
        
        // Check each enemy to see if it's within the attack cone
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            const enemyPosition = enemy.position.clone();
            
            // Calculate vector from player to enemy
            const toEnemy = new THREE.Vector3().subVectors(enemyPosition, playerPosition);
            
            // Check if enemy is within range
            const distance = toEnemy.length();
            if (distance > attackRange) {
                continue; // Enemy is too far away
            }
            
            // Normalize the vectors for angle calculation
            toEnemy.normalize();
            
            // Calculate the angle between attack direction and direction to enemy
            const dot = attackDirection.dot(toEnemy);
            const angle = Math.acos(dot);
            
            // Check if enemy is within the attack angle
            if (angle <= attackAngle / 2) {
                // Enemy is hit!
                enemy.takeDamage(attackDamage);
                
                // Apply knockback to the enemy
                const knockbackDirection = toEnemy.multiplyScalar(3);
                enemy.applyKnockback(knockbackDirection);
                
                // Play attack hit sound
                this.player.assetLoader.playSound('attackHit');
                
                // Show hit effect
                this.showHitEffect(enemyPosition);
            }
        }
    }
    
    showHitEffect(position) {
        // Create a simple hit effect with particles
        const particleCount = 10;
        const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.7
        });
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(position);
            
            // Add random offset
            particle.position.x += (Math.random() - 0.5) * 0.5;
            particle.position.y += (Math.random() - 0.5) * 0.5 + 0.5; // Raise slightly
            particle.position.z += (Math.random() - 0.5) * 0.5;
            
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
    
    // Add new method to handle enemy deaths
    handleEnemyDeath(deathData) {
        // Increase score
        this.state.score.crystals += 1;
        
        // Update UI
        this.updateUI();
        
        // Show message
        this.ui.showMessage("Enemy defeated! +1 Crystal", 2000);
        
        // Check if all enemies are defeated
        if (this.level.getEnemies().length === 0) {
            // Show message
            this.ui.showMessage("All enemies defeated!", 3000);
            
            // Add bonus crystals
            const bonus = 5;
            this.state.score.crystals += bonus;
            
            // Update UI
            this.updateUI();
            
            // Show bonus message
            setTimeout(() => {
                this.ui.showMessage(`Bonus: +${bonus} Crystals!`, 2000);
            }, 3000);
        }
    }
} 