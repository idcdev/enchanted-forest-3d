import * as THREE from 'three';
import { Collectible } from './Collectible.js';
import { Enemy } from './Enemy.js';
import { MovingPlatform } from './platforms/MovingPlatform.js';
import { DisappearingPlatform } from './platforms/DisappearingPlatform.js';
import { Platform } from './platforms/Platform.js';

export class Level {
    constructor(scene, assetLoader, config = null) {
        this.scene = scene;
        this.assetLoader = assetLoader;
        this.config = config || this.getDefaultConfig();
        
        // Level elements
        this.platforms = [];
        this.collectibles = [];
        this.enemies = [];
        this.decorations = [];
        this.obstacles = [];
        
        // Level stats
        this.totalCrystals = 0;
        this.totalSeeds = 0;
        
        // Level state
        this.isLoaded = false;
    }
    
    getDefaultConfig() {
        return {
            name: "Floresta Encantada",
            difficulty: "Fácil",
            description: "Uma floresta mágica com plataformas básicas e poucos inimigos.",
            platformCount: 15,
            collectibleCount: { crystals: 10, seeds: 5 },
            enemyCount: 3,
            specialFeatures: []
        };
    }
    
    load() {
        if (!this.isLoaded) {
            this.createLevel();
            this.isLoaded = true;
        }
    }
    
    unload() {
        if (this.isLoaded) {
            // Remove all elements from the scene
            
            // Remove platforms
            for (const platform of this.platforms) {
                platform.remove();
            }
            
            // Remove collectibles
            for (const collectible of this.collectibles) {
                collectible.remove();
            }
            
            // Remove enemies
            for (const enemy of this.enemies) {
                enemy.remove();
            }
            
            // Remove decorations
            for (const decoration of this.decorations) {
                this.scene.remove(decoration);
                if (decoration.geometry) decoration.geometry.dispose();
                if (decoration.material) decoration.material.dispose();
            }
            
            // Remove obstacles
            for (const obstacle of this.obstacles) {
                this.scene.remove(obstacle);
                if (obstacle.geometry) obstacle.geometry.dispose();
                if (obstacle.material) obstacle.material.dispose();
            }
            
            // Clear arrays
            this.platforms = [];
            this.collectibles = [];
            this.enemies = [];
            this.decorations = [];
            this.obstacles = [];
            
            // Reset stats
            this.totalCrystals = 0;
            this.totalSeeds = 0;
            
            this.isLoaded = false;
        }
    }
    
    createLevel() {
        // Create ground
        this.createGround();
        
        // Create platforms
        this.createPlatforms();
        
        // Create collectibles
        this.createCollectibles();
        
        // Create enemies
        this.createEnemies();
        
        // Create decorations
        this.createDecorations();
    }
    
    createGround() {
        // Create a large ground plane
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4caf50,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0; // Ensure ground is at y=0
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Create a box collider for the ground
        const groundColliderGeometry = new THREE.BoxGeometry(200, 0.2, 200);
        const groundColliderMaterial = new THREE.MeshBasicMaterial({ 
            visible: false // Make it invisible
        });
        const groundColliderMesh = new THREE.Mesh(groundColliderGeometry, groundColliderMaterial);
        groundColliderMesh.position.y = -0.1; // Slightly below visual ground
        this.scene.add(groundColliderMesh);
        
        // Add ground to platforms array for collision detection
        const groundCollider = new THREE.Box3().setFromObject(groundColliderMesh);
        this.platforms.push({ 
            mesh: groundColliderMesh, 
            collider: groundCollider,
            dimensions: { width: 200, height: 0.2, depth: 200 },
            position: { x: 0, y: -0.1, z: 0 },
            visualMesh: ground // Reference to the visual mesh
        });
    }
    
    createPlatforms() {
        const { platformCount, specialFeatures } = this.config;
        
        // Calculate how many of each platform type to create
        const hasMovingPlatforms = specialFeatures.includes('movingPlatforms');
        const hasDisappearingPlatforms = specialFeatures.includes('disappearingPlatforms');
        
        let regularCount = platformCount;
        let movingCount = 0;
        let disappearingCount = 0;
        
        if (hasMovingPlatforms) {
            movingCount = Math.floor(platformCount * 0.3); // 30% moving platforms
            regularCount -= movingCount;
        }
        
        if (hasDisappearingPlatforms) {
            disappearingCount = Math.floor(platformCount * 0.2); // 20% disappearing platforms
            regularCount -= disappearingCount;
        }
        
        // Create regular platforms
        for (let i = 0; i < regularCount; i++) {
            const x = (Math.random() - 0.5) * 40;
            const y = Math.random() * 10 + 2;
            const z = (Math.random() - 0.5) * 40;
            
            const width = Math.random() * 3 + 2;
            const height = 0.5;
            const depth = Math.random() * 3 + 2;
            
            this.createPlatform(x, y, z, width, height, depth);
        }
        
        // Create moving platforms
        for (let i = 0; i < movingCount; i++) {
            const x = (Math.random() - 0.5) * 40;
            const y = Math.random() * 10 + 2;
            const z = (Math.random() - 0.5) * 40;
            
            const width = Math.random() * 2 + 1.5;
            const height = 0.5;
            const depth = Math.random() * 2 + 1.5;
            
            // Define movement parameters
            const moveDistance = Math.random() * 5 + 3;
            const moveSpeed = Math.random() * 2 + 1;
            const moveAxis = Math.random() > 0.5 ? 'x' : 'z';
            
            this.createMovingPlatform(x, y, z, width, height, depth, moveAxis, moveDistance, moveSpeed);
        }
        
        // Create disappearing platforms
        for (let i = 0; i < disappearingCount; i++) {
            const x = (Math.random() - 0.5) * 40;
            const y = Math.random() * 10 + 2;
            const z = (Math.random() - 0.5) * 40;
            
            const width = Math.random() * 2 + 1.5;
            const height = 0.5;
            const depth = Math.random() * 2 + 1.5;
            
            // Define disappearing parameters
            const disappearTime = Math.random() * 1 + 0.5;
            const reappearTime = Math.random() * 2 + 1;
            
            this.createDisappearingPlatform(x, y, z, width, height, depth, disappearTime, reappearTime);
        }
    }
    
    createPlatform(x, y, z, width, height, depth) {
        const platform = new Platform(this.scene, x, y, z, width, height, depth);
        this.platforms.push(platform);
    }
    
    createMovingPlatform(x, y, z, width, height, depth, moveAxis, moveDistance, moveSpeed) {
        const platform = new MovingPlatform(
            this.scene,
            x, y, z,
            width, height, depth,
            moveAxis, moveDistance, moveSpeed
        );
        
        this.platforms.push(platform);
    }
    
    createDisappearingPlatform(x, y, z, width, height, depth, disappearTime, reappearTime) {
        const platform = new DisappearingPlatform(
            this.scene,
            x, y, z,
            width, height, depth,
            disappearTime, reappearTime
        );
        
        this.platforms.push(platform);
    }
    
    createCollectibles() {
        const { collectibleCount } = this.config;
        
        // Create crystals
        for (let i = 0; i < collectibleCount.crystals; i++) {
            const x = (Math.random() - 0.5) * 40;
            const y = Math.random() * 10 + 2;
            const z = (Math.random() - 0.5) * 40;
            
            this.createCollectible('crystal', x, y, z);
            this.totalCrystals++;
        }
        
        // Create seeds
        for (let i = 0; i < collectibleCount.seeds; i++) {
            const x = (Math.random() - 0.5) * 40;
            const y = Math.random() * 10 + 2;
            const z = (Math.random() - 0.5) * 40;
            
            this.createCollectible('seed', x, y, z);
            this.totalSeeds++;
        }
    }
    
    createCollectible(type, x, y, z) {
        const collectible = new Collectible(this.scene, type, x, y, z);
        this.collectibles.push(collectible);
    }
    
    createEnemies() {
        const { enemyCount } = this.config;
        
        for (let i = 0; i < enemyCount; i++) {
            const x = (Math.random() - 0.5) * 40;
            const y = 0.8; // Enemy height
            const z = (Math.random() - 0.5) * 40;
            
            const patrolRadius = Math.random() * 5 + 3;
            
            this.createEnemy(x, y, z, patrolRadius);
        }
    }
    
    createEnemy(x, y, z, patrolRadius) {
        // Create a new enemy at the specified position
        const enemy = new Enemy(this.scene, x, y, z, patrolRadius, this.assetLoader);
        this.enemies.push(enemy);
    }
    
    createDecorations() {
        // Create trees
        this.createTrees();
        
        // Create mushrooms
        this.createMushrooms();
        
        // Create flowers
        this.createFlowers();
    }
    
    createTrees() {
        // Create several trees around the level
        for (let i = 0; i < 40; i++) {
            // Random position around the level
            const x = Math.random() * 180 - 90;
            const z = Math.random() * 180 - 90;
            
            // Don't place trees on platforms
            let validPosition = true;
            for (const platform of this.platforms) {
                if (platform.mesh !== this.platforms[0].mesh) { // Skip ground
                    const platformPos = platform.mesh.position;
                    const distance = Math.sqrt(
                        Math.pow(x - platformPos.x, 2) + 
                        Math.pow(z - platformPos.z, 2)
                    );
                    
                    if (distance < 3) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            if (validPosition) {
                this.createTree(x, 0, z);
            }
        }
    }
    
    createTree(x, y, z) {
        // Create a simple tree with trunk and leaves
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 4, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8d6e63,
            roughness: 0.9,
            metalness: 0.1
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, y + 2, z);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        this.scene.add(trunk);
        
        // Create leaves (a few spheres clustered together)
        const leafColors = [0x4caf50, 0x66bb6a, 0x81c784];
        const leafCount = Math.floor(Math.random() * 3) + 2;
        
        const leavesGroup = new THREE.Group();
        
        for (let i = 0; i < leafCount; i++) {
            const leafSize = Math.random() * 1.5 + 1.5;
            const leafGeometry = new THREE.SphereGeometry(leafSize, 8, 8);
            const leafMaterial = new THREE.MeshStandardMaterial({ 
                color: leafColors[Math.floor(Math.random() * leafColors.length)],
                roughness: 0.8,
                metalness: 0.1
            });
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            
            // Position leaf on top of trunk with some randomness
            leaf.position.set(
                (Math.random() * 0.5 - 0.25),
                4 + (Math.random() * 0.5),
                (Math.random() * 0.5 - 0.25)
            );
            
            leaf.castShadow = true;
            leavesGroup.add(leaf);
        }
        
        leavesGroup.position.set(x, y, z);
        this.scene.add(leavesGroup);
        
        // Create collision box for the tree
        const treeColliderGeometry = new THREE.BoxGeometry(2, 8, 2);
        const treeColliderMaterial = new THREE.MeshBasicMaterial({
            visible: false // Make it invisible
        });
        const treeCollider = new THREE.Mesh(treeColliderGeometry, treeColliderMaterial);
        treeCollider.position.set(x, y + 4, z); // Position at center of tree
        this.scene.add(treeCollider);
        
        // Add to decorations array
        this.decorations.push(trunk);
        this.decorations.push(leavesGroup);
        
        // Add to obstacles array for collision detection
        const collider = new THREE.Box3().setFromObject(treeCollider);
        this.obstacles = this.obstacles || [];
        this.obstacles.push({ 
            mesh: treeCollider, 
            collider: collider,
            type: 'tree'
        });
    }
    
    createMushrooms() {
        // Create several mushrooms around the level
        for (let i = 0; i < 30; i++) {
            // Random position around the level
            const x = Math.random() * 160 - 80;
            const z = Math.random() * 160 - 80;
            
            this.createMushroom(x, 0, z);
        }
    }
    
    createMushroom(x, y, z) {
        // Create a mushroom with stem and cap
        const stemGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.8, 8);
        const stemMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            roughness: 0.7,
            metalness: 0.1
        });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.set(x, y + 0.4, z);
        stem.castShadow = true;
        stem.receiveShadow = true;
        this.scene.add(stem);
        
        // Create cap
        const capGeometry = new THREE.SphereGeometry(0.5, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const capMaterial = new THREE.MeshStandardMaterial({ 
            color: Math.random() > 0.5 ? 0xff5252 : 0x7e57c2,
            roughness: 0.7,
            metalness: 0.1
        });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.set(x, y + 0.8, z);
        cap.castShadow = true;
        cap.receiveShadow = true;
        this.scene.add(cap);
        
        // Create collision cylinder for the mushroom
        const mushroomColliderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
        const mushroomColliderMaterial = new THREE.MeshBasicMaterial({
            visible: false // Make it invisible
        });
        const mushroomCollider = new THREE.Mesh(mushroomColliderGeometry, mushroomColliderMaterial);
        mushroomCollider.position.set(x, y + 0.5, z); // Position at center of mushroom
        this.scene.add(mushroomCollider);
        
        // Add to decorations array
        this.decorations.push(stem);
        this.decorations.push(cap);
        
        // Add to obstacles array for collision detection
        const collider = new THREE.Box3().setFromObject(mushroomCollider);
        this.obstacles = this.obstacles || [];
        this.obstacles.push({ 
            mesh: mushroomCollider, 
            collider: collider,
            type: 'mushroom'
        });
    }
    
    createFlowers() {
        // Create several flowers around the level
        for (let i = 0; i < 60; i++) {
            // Random position around the level
            const x = Math.random() * 180 - 90;
            const z = Math.random() * 180 - 90;
            
            this.createFlower(x, 0, z);
        }
    }
    
    createFlower(x, y, z) {
        // Create a simple flower with stem and petals
        const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
        const stemMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4caf50,
            roughness: 0.8,
            metalness: 0.1
        });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.set(x, y + 0.25, z);
        stem.castShadow = true;
        this.scene.add(stem);
        
        // Create flower head
        const flowerColors = [0xff4081, 0xffeb3b, 0x2196f3, 0xf44336, 0x9c27b0];
        const flowerColor = flowerColors[Math.floor(Math.random() * flowerColors.length)];
        
        const petalCount = Math.floor(Math.random() * 3) + 5;
        const flowerGroup = new THREE.Group();
        
        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2;
            const petalGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const petalMaterial = new THREE.MeshStandardMaterial({ 
                color: flowerColor,
                roughness: 0.7,
                metalness: 0.1
            });
            const petal = new THREE.Mesh(petalGeometry, petalMaterial);
            
            petal.position.set(
                Math.cos(angle) * 0.15,
                0,
                Math.sin(angle) * 0.15
            );
            
            flowerGroup.add(petal);
        }
        
        // Create center of flower
        const centerGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const centerMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffeb3b,
            roughness: 0.7,
            metalness: 0.1
        });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        flowerGroup.add(center);
        
        flowerGroup.position.set(x, y + 0.5, z);
        this.scene.add(flowerGroup);
        
        // Create collision cylinder for the flower (smaller than others)
        const flowerColliderGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 8);
        const flowerColliderMaterial = new THREE.MeshBasicMaterial({
            visible: false // Make it invisible
        });
        const flowerCollider = new THREE.Mesh(flowerColliderGeometry, flowerColliderMaterial);
        flowerCollider.position.set(x, y + 0.25, z); // Position at center of flower
        this.scene.add(flowerCollider);
        
        // Add to decorations array
        this.decorations.push(stem);
        this.decorations.push(flowerGroup);
        
        // Add to obstacles array for collision detection
        const collider = new THREE.Box3().setFromObject(flowerCollider);
        this.obstacles = this.obstacles || [];
        this.obstacles.push({ 
            mesh: flowerCollider, 
            collider: collider,
            type: 'flower'
        });
    }
    
    update(deltaTime, player) {
        // Update collectibles
        for (const collectible of this.collectibles) {
            // Skip update if collectible is culled
            if (collectible.isCulled) continue;
            
            collectible.update(deltaTime);
        }
        
        // Update enemies
        for (const enemy of this.enemies) {
            // Skip update if enemy is culled
            if (enemy.isCulled) continue;
            
            enemy.update(deltaTime, player);
        }
        
        // Update platforms
        for (const platform of this.platforms) {
            // Only update platforms that have an update method
            // and are within a reasonable distance from the player
            if (platform.update) {
                // Get distance to player
                const distance = platform.position ? 
                    platform.position.distanceTo(player.position) : 0;
                
                // Only update platforms that are close to the player
                if (distance < 50) {
                    platform.update(deltaTime);
                }
            }
        }
    }
    
    checkPlatformCollisions(player) {
        // Check if player is colliding with any platform
        let isOnAnyPlatform = false;
        
        for (const platform of this.platforms) {
            // Skip inactive platforms (e.g., disappearing platforms that are currently invisible)
            // Check if platform has isVisible method (new platform system) or use mesh.visible (old platform system)
            if ((typeof platform.isVisible === 'function' && !platform.isVisible()) || 
                (platform.mesh && platform.mesh.visible === false)) {
                continue;
            }
            
            // Get platform collider - handle both new and old platform systems
            const platformCollider = platform.getCollider ? platform.getCollider() : platform.collider;
            const playerCollider = player.getCollider();
            
            // Check if player is colliding with platform
            if (playerCollider.intersectsBox(platformCollider)) {
                // Get platform dimensions - handle both new and old platform systems
                const platformWidth = platform.dimensions ? 
                    (platform.dimensions.x || platform.dimensions.width) : platform.dimensions.width;
                const platformHeight = platform.dimensions ? 
                    (platform.dimensions.y || platform.dimensions.height) : platform.dimensions.height;
                const platformDepth = platform.dimensions ? 
                    (platform.dimensions.z || platform.dimensions.depth) : platform.dimensions.depth;
                
                // Get platform position - handle both new and old platform systems
                const platformPosition = platform.position || platform.mesh.position;
                
                // Calculate platform bounds
                const platformMinX = platformPosition.x - platformWidth / 2;
                const platformMaxX = platformPosition.x + platformWidth / 2;
                const platformMinY = platformPosition.y - platformHeight / 2;
                const platformMaxY = platformPosition.y + platformHeight / 2;
                const platformMinZ = platformPosition.z - platformDepth / 2;
                const platformMaxZ = platformPosition.z + platformDepth / 2;
                
                // Get player bounds
                const playerBounds = playerCollider;
                
                // Calculate penetration depths
                const penetrationX = Math.min(
                    playerBounds.max.x - platformMinX,
                    platformMaxX - playerBounds.min.x
                );
                
                const penetrationY = Math.min(
                    playerBounds.max.y - platformMinY,
                    platformMaxY - playerBounds.min.y
                );
                
                const penetrationZ = Math.min(
                    playerBounds.max.z - platformMinZ,
                    platformMaxZ - playerBounds.min.z
                );
                
                // Determine smallest penetration axis
                if (penetrationY <= penetrationX && penetrationY <= penetrationZ) {
                    // Vertical collision (top or bottom)
                    if (player.velocity.y <= 0 && playerBounds.min.y >= platformMinY) {
                        // Player is on top of platform
                        player.position.y = platformMaxY + 0.8; // 0.8 is half player height
                        player.velocity.y = 0;
                        player.isGrounded = true;
                        player.isJumping = false;
                        isOnAnyPlatform = true;
                        
                        // If we just landed, play landing sound
                        if (player.wasInAir) {
                            player.assetLoader.playSound('land');
                            player.wasInAir = false;
                        }
                        
                        // If it's a moving platform, apply platform velocity to player
                        if (platform.constructor && platform.constructor.name === 'MovingPlatform') {
                            const platformVelocity = platform.getVelocity();
                            player.position.x += platformVelocity.x * 0.016; // Approximate deltaTime
                            player.position.z += platformVelocity.z * 0.016;
                        }
                    } else if (player.velocity.y > 0) {
                        // Player hit bottom of platform
                        player.position.y = platformMinY - 0.8; // 0.8 is half player height
                        player.velocity.y = 0;
                    }
                } else if (penetrationX <= penetrationZ) {
                    // Horizontal X collision
                    if (playerBounds.min.x < platformMinX) {
                        // Player hit left side of platform
                        player.position.x = platformMinX - 0.4; // 0.4 is half player width
                    } else {
                        // Player hit right side of platform
                        player.position.x = platformMaxX + 0.4;
                    }
                    player.velocity.x = 0;
                } else {
                    // Horizontal Z collision
                    if (playerBounds.min.z < platformMinZ) {
                        // Player hit front side of platform
                        player.position.z = platformMinZ - 0.4; // 0.4 is half player depth
                    } else {
                        // Player hit back side of platform
                        player.position.z = platformMaxZ + 0.4;
                    }
                    player.velocity.z = 0;
                }
            }
        }
        
        // If player is not on any platform and was previously grounded, set to falling
        if (!isOnAnyPlatform && player.isGrounded && !player.isFlying) {
            player.isGrounded = false;
            player.wasInAir = true;
        }
    }
    
    checkObstacleCollisions(player) {
        // Check if player is colliding with any obstacle
        for (const obstacle of this.obstacles) {
            // Skip invisible obstacles
            if (obstacle.mesh && obstacle.mesh.visible === false) {
                continue;
            }
            
            // Get obstacle collider
            const obstacleCollider = obstacle.collider;
            
            // Get player collider
            const playerCollider = player.getCollider();
            
            // Check if player is colliding with obstacle
            if (playerCollider.intersectsBox(obstacleCollider)) {
                // Get obstacle dimensions
                const obstacleWidth = obstacle.dimensions ? obstacle.dimensions.width : 1;
                const obstacleHeight = obstacle.dimensions ? obstacle.dimensions.height : 1;
                const obstacleDepth = obstacle.dimensions ? obstacle.dimensions.depth : 1;
                
                // Get obstacle position
                const obstaclePosition = obstacle.mesh.position;
                
                // Calculate obstacle bounds
                const obstacleMinX = obstaclePosition.x - obstacleWidth / 2;
                const obstacleMaxX = obstaclePosition.x + obstacleWidth / 2;
                const obstacleMinY = obstaclePosition.y - obstacleHeight / 2;
                const obstacleMaxY = obstaclePosition.y + obstacleHeight / 2;
                const obstacleMinZ = obstaclePosition.z - obstacleDepth / 2;
                const obstacleMaxZ = obstaclePosition.z + obstacleDepth / 2;
                
                // Get player bounds
                const playerBounds = playerCollider;
                
                // Calculate penetration depths
                const penetrationX = Math.min(
                    playerBounds.max.x - obstacleMinX,
                    obstacleMaxX - playerBounds.min.x
                );
                
                const penetrationY = Math.min(
                    playerBounds.max.y - obstacleMinY,
                    obstacleMaxY - playerBounds.min.y
                );
                
                const penetrationZ = Math.min(
                    playerBounds.max.z - obstacleMinZ,
                    obstacleMaxZ - playerBounds.min.z
                );
                
                // Determine smallest penetration axis
                if (penetrationX <= penetrationY && penetrationX <= penetrationZ) {
                    // Horizontal X collision
                    if (player.position.x < obstaclePosition.x) {
                        // Player hit left side of obstacle
                        player.position.x = obstacleMinX - 0.4; // 0.4 is half player width
                    } else {
                        // Player hit right side of obstacle
                        player.position.x = obstacleMaxX + 0.4;
                    }
                    player.velocity.x = 0;
                } else if (penetrationZ <= penetrationY) {
                    // Horizontal Z collision
                    if (player.position.z < obstaclePosition.z) {
                        // Player hit front side of obstacle
                        player.position.z = obstacleMinZ - 0.4; // 0.4 is half player depth
                    } else {
                        // Player hit back side of obstacle
                        player.position.z = obstacleMaxZ + 0.4;
                    }
                    player.velocity.z = 0;
                } else {
                    // Vertical collision
                    if (player.position.y < obstaclePosition.y) {
                        // Player hit bottom of obstacle
                        player.position.y = obstacleMinY - 0.8; // 0.8 is half player height
                        player.velocity.y = 0;
                    } else {
                        // Player hit top of obstacle
                        player.position.y = obstacleMaxY + 0.8;
                        player.velocity.y = 0;
                        player.isGrounded = true;
                        player.isJumping = false;
                    }
                }
            }
        }
    }
    
    getCollectibles() {
        return this.collectibles;
    }
    
    getEnemies() {
        return this.enemies;
    }
    
    getPlatforms() {
        return this.platforms;
    }
    
    getTotalCrystals() {
        return this.totalCrystals;
    }
    
    getTotalSeeds() {
        return this.totalSeeds;
    }
    
    removeCollectible(index) {
        // Remove collectible from scene
        this.collectibles[index].remove();
        
        // Remove from array
        this.collectibles.splice(index, 1);
    }
    
    reset() {
        // Remove all elements from the scene
        this.unload();
        
        // Recreate the level
        this.load();
    }
} 