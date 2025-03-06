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
            isPlaying: false, // Changed to false until class is selected
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
        
        // Setup class selection callback
        this.setupClassSelection();
        
        // Show level info
        this.showLevelInfo();
        
        // Culling settings
        this.cullingDistance = 50; // Distance beyond which objects are culled
        this.cullingFrequency = 5; // How often to check for distant objects (frames)
        this.frameCount = 0;
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
    
    setupClassSelection() {
        console.log('Game.setupClassSelection called');
        
        // Set callback for class selection
        if (this.ui) {
            console.log('Setting class selection callback');
            this.ui.setClassSelectionCallback((className) => {
                console.log(`Class selection callback called with className: ${className}`);
                
                // Set player class
                if (this.player) {
                    this.player.setClass(className);
                } else {
                    console.error('Player not available for setting class');
                }
                
                // Start the game
                this.state.isPlaying = true;
                
                // Start the clock if it's not already running
                if (this.clock && this.clock.running === false) {
                    console.log('Starting game clock');
                    this.clock.start();
                }
                
                // Show message
                this.ui.showMessage(`You are now a ${className}. Good luck!`, 3000);
            });
        } else {
            console.error('UI not available for setting class selection callback');
        }
    }
    
    showLevelInfo() {
        const levelInfo = this.levelManager.getCurrentLevelInfo();
        this.ui.showMessage(`Nível: ${levelInfo.name} - ${levelInfo.difficulty}`, 5000);
    }
    
    update(deltaTime) {
        // Skip if game is paused or over
        if (this.state.isPaused || this.state.isGameOver || this.state.isLevelComplete) {
            return;
        }
        
        // Update frame counter for culling
        this.frameCount++;
        
        // Update player
        this.player.update(deltaTime);
        
        // Update level (platforms, enemies, collectibles)
        this.level.update(deltaTime, this.player);
        
        // Check collisions
        this.checkCollisions();
        
        // Check projectile collisions
        this.checkProjectileCollisions();
        
        // Update camera
        this.updateCamera();
        
        // Update UI
        this.updateUI();
        
        // Check game conditions
        this.checkGameConditions();
        
        // Perform object culling every few frames
        if (this.frameCount % this.cullingFrequency === 0) {
            this.performCulling();
        }
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
                // Only take damage if the enemy is attacking and player is not invulnerable
                if (enemy.isCurrentlyAttacking() && !this.player.isInvulnerable) {
                    // Handle enemy collision
                    this.damagePlayer(enemy.getAttackDamage());
                    
                    // Knockback player
                    const knockbackDirection = new THREE.Vector3()
                        .subVectors(this.player.position, enemy.position)
                        .normalize()
                        .multiplyScalar(8); // Increased knockback for better escape
                    this.player.applyKnockback(knockbackDirection);
                    
                    // Play enemy attack sound
                    this.player.assetLoader.playSound('enemyAttack');
                    
                    // Show hit message
                    this.ui.showMessage(`Hit! -${enemy.getAttackDamage()} health`, 1000);
                }
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
        // Skip damage if player is invulnerable
        if (this.player.isInvulnerable) {
            return;
        }
        
        this.state.health = Math.max(0, this.state.health - amount);
        
        // Visual feedback for damage
        this.player.showDamageEffect();
        
        // Make player invulnerable for a short time
        this.player.makeInvulnerable(1.5); // 1.5 seconds of invulnerability
        
        // Camera shake effect for damage feedback
        this.shakeCamera(0.5, 0.2); // Duration, intensity
        
        // Play damage sound
        this.player.assetLoader.playSound('playerDamage');
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
        const playerClass = attackData.playerClass;
        
        // For warrior (melee attack), check enemies in cone
        if (playerClass === 'warrior') {
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
        
        // For archer and mage, projectiles are handled in checkProjectileCollisions
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
    
    checkProjectileCollisions() {
        const enemies = this.level.getEnemies();
        const projectiles = this.player.projectiles;
        
        // Check each projectile against each enemy
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const projectile = projectiles[i];
            const projectileBox = new THREE.Box3().setFromObject(projectile.mesh);
            
            for (let j = 0; j < enemies.length; j++) {
                const enemy = enemies[j];
                const enemyBox = enemy.getCollider();
                
                // Check collision
                if (this.physics.checkCollision(projectileBox, enemyBox)) {
                    // Enemy is hit!
                    enemy.takeDamage(projectile.damage);
                    
                    // Apply knockback to the enemy based on projectile direction
                    const knockbackDirection = projectile.velocity.clone().normalize().multiplyScalar(2);
                    enemy.applyKnockback(knockbackDirection);
                    
                    // Play hit sound based on projectile type
                    if (projectile.type === 'arrow') {
                        this.player.assetLoader.playSound('arrowHit');
                    } else if (projectile.type === 'spell') {
                        this.player.assetLoader.playSound('spellHit');
                    }
                    
                    // Show hit effect
                    this.showHitEffect(enemy.position.clone());
                    
                    // For mage spell, create area effect
                    if (projectile.type === 'spell') {
                        this.createSpellAreaEffect(projectile.position.clone(), projectile.damage / 2);
                    }
                    
                    // Remove projectile
                    this.scene.remove(projectile.mesh);
                    projectiles.splice(i, 1);
                    
                    // Break to next projectile
                    break;
                }
            }
        }
    }
    
    createSpellAreaEffect(position, damage) {
        // Create visual effect
        const areaGeometry = new THREE.CircleGeometry(3, 32);
        const areaMaterial = new THREE.MeshBasicMaterial({
            color: 0x3f51b5,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const areaEffect = new THREE.Mesh(areaGeometry, areaMaterial);
        areaEffect.position.copy(position);
        areaEffect.rotation.x = Math.PI / 2;
        
        this.scene.add(areaEffect);
        
        // Damage all enemies in area
        const enemies = this.level.getEnemies();
        const areaRadius = 3;
        
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            const distance = enemy.position.distanceTo(position);
            
            if (distance <= areaRadius) {
                // Enemy is in area effect
                enemy.takeDamage(damage);
                
                // Show hit effect
                this.showHitEffect(enemy.position.clone());
            }
        }
        
        // Animate and remove area effect
        const startTime = Date.now();
        const duration = 1000; // 1 second
        
        const animateArea = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                // Scale up and fade out
                areaEffect.scale.set(1 + progress, 1 + progress, 1);
                areaEffect.material.opacity = 0.3 * (1 - progress);
                
                requestAnimationFrame(animateArea);
            } else {
                // Remove effect
                this.scene.remove(areaEffect);
            }
        };
        
        animateArea();
    }
    
    // Add camera shake effect for better feedback - NEW
    shakeCamera(duration, intensity) {
        const originalPosition = this.camera.position.clone();
        const startTime = Date.now();
        
        const shakeInterval = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            
            if (elapsed >= duration) {
                clearInterval(shakeInterval);
                this.camera.position.copy(originalPosition);
                return;
            }
            
            // Decrease intensity over time
            const currentIntensity = intensity * (1 - elapsed / duration);
            
            // Apply random offset to camera
            this.camera.position.x = originalPosition.x + (Math.random() - 0.5) * currentIntensity;
            this.camera.position.y = originalPosition.y + (Math.random() - 0.5) * currentIntensity;
            this.camera.position.z = originalPosition.z + (Math.random() - 0.5) * currentIntensity;
        }, 16); // ~60fps
    }
    
    // Cull distant objects to improve performance
    performCulling() {
        const playerPosition = this.player.position;
        
        // Get all enemies from the level
        const enemies = this.level.getEnemies();
        
        // Cull distant enemies
        for (const enemy of enemies) {
            const distance = enemy.position.distanceTo(playerPosition);
            
            // If enemy is far away, reduce update frequency or disable completely
            if (distance > this.cullingDistance) {
                enemy.isCulled = true;
            } else {
                enemy.isCulled = false;
            }
        }
        
        // Get all collectibles from the level
        const collectibles = this.level.getCollectibles();
        
        // Cull distant collectibles
        for (const collectible of collectibles) {
            const distance = collectible.position.distanceTo(playerPosition);
            
            // If collectible is far away, reduce update frequency
            if (distance > this.cullingDistance) {
                collectible.isCulled = true;
            } else {
                collectible.isCulled = false;
            }
        }
    }
} 