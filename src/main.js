import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Game } from './components/Game.js';
import { Player } from './components/Player.js';
import { UI } from './components/UI.js';
import { AssetLoader } from './utils/AssetLoader.js';
import { InputHandler } from './utils/InputHandler.js';

// Game initialization
class Main {
    constructor() {
        // Setup quality settings
        this.qualitySettings = {
            low: {
                pixelRatio: 0.75,
                antialias: false,
                shadows: false,
                shadowMapSize: 512,
                maxLights: 0,
                particleMultiplier: 0.3
            },
            medium: {
                pixelRatio: 1.0,
                antialias: true,
                shadows: true,
                shadowMapSize: 1024,
                maxLights: 2,
                particleMultiplier: 0.6
            },
            high: {
                pixelRatio: Math.min(window.devicePixelRatio, 2),
                antialias: true,
                shadows: true,
                shadowMapSize: 2048,
                maxLights: 5,
                particleMultiplier: 1.0
            }
        };
        
        // Default to medium quality
        this.currentQuality = localStorage.getItem('gameQuality') || 'medium';
        this.quality = this.qualitySettings[this.currentQuality];
        
        // Setup loading screen
        this.loadingManager = new THREE.LoadingManager();
        this.setupLoadingManager();
        
        // Setup renderer with quality settings
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: this.quality.antialias 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(this.quality.pixelRatio);
        this.renderer.shadowMap.enabled = this.quality.shadows;
        this.renderer.shadowMap.type = THREE.PCFShadowMap; // Less demanding than PCFSoftShadowMap
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        
        // Setup camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
        
        // Setup scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x88ccee);
        this.scene.fog = new THREE.FogExp2(0x88ccee, 0.02);
        
        // Setup lights
        this.setupLights();
        
        // Setup asset loader
        this.assetLoader = new AssetLoader(this.loadingManager);
        
        // Add audio listener to camera
        if (this.assetLoader.getAudioListener()) {
            this.camera.add(this.assetLoader.getAudioListener());
        }
        
        // Setup input handler
        this.inputHandler = new InputHandler();
        
        // Setup UI
        this.ui = new UI();
        
        // Setup game components
        this.player = null;
        this.game = null;
        
        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Start loading assets
        this.loadAssets();
        
        // Fallback: Start game after a timeout if loading doesn't complete
        this.loadingTimeout = setTimeout(() => {
            console.warn('Loading timeout reached, starting game anyway');
            
            // Initialize game components first
            this.startGame();
            
            // Then hide loading screen and show class selection
            if (this.ui) {
                console.log('Calling hideLoadingScreen from timeout fallback');
                this.ui.hideLoadingScreen();
            } else {
                console.error('UI not available for hiding loading screen');
                
                // Fallback: Hide loading screen directly
                const loadingScreen = document.getElementById('loading-screen');
                if (loadingScreen) {
                    loadingScreen.style.opacity = '0';
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                    }, 1000);
                }
            }
        }, 5000); // 5 seconds timeout
    }
    
    setupLoadingManager() {
        const progressBar = document.getElementById('progress-bar');
        const loadingText = document.getElementById('loading-text');
        
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal) * 100;
            progressBar.style.width = progress + '%';
            loadingText.textContent = `Loading... ${Math.round(progress)}%`;
        };
        
        this.loadingManager.onLoad = () => {
            console.log('Loading complete!');
            loadingText.textContent = 'Loading complete!';
            
            // Clear the loading timeout
            if (this.loadingTimeout) {
                clearTimeout(this.loadingTimeout);
                this.loadingTimeout = null;
            }
            
            // Wait a moment before starting the game
            setTimeout(() => {
                // Initialize game components first
                this.startGame();
                
                // Then hide loading screen and show class selection
                // This ensures the UI has access to the game instance
                if (this.ui) {
                    console.log('Calling hideLoadingScreen to show class selection');
                    this.ui.hideLoadingScreen();
                } else {
                    console.error('UI not available for hiding loading screen');
                }
            }, 1000);
        };
        
        // Modify error handling to be less intrusive
        this.loadingManager.onError = (url) => {
            // Just log the error without affecting the loading process
            console.warn(`Non-critical error loading asset: ${url}`);
            
            // Continue with loading process
            // The AssetLoader will use fallbacks for missing assets
        };
    }
    
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x6688cc, 0.5);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffbb, 1);
        directionalLight.position.set(60, 100, 40);
        
        // Only enable shadows if quality settings allow it
        if (this.quality.shadows) {
            directionalLight.castShadow = true;
            directionalLight.shadow.camera.near = 1;
            directionalLight.shadow.camera.far = 500;
            directionalLight.shadow.camera.left = -50;
            directionalLight.shadow.camera.right = 50;
            directionalLight.shadow.camera.top = 50;
            directionalLight.shadow.camera.bottom = -50;
            directionalLight.shadow.mapSize.width = this.quality.shadowMapSize;
            directionalLight.shadow.mapSize.height = this.quality.shadowMapSize;
        }
        this.scene.add(directionalLight);
        
        // Add point lights based on quality settings
        if (this.quality.maxLights > 0) {
            const colors = [0x88ff88, 0xffaa88, 0x8888ff];
            const maxLights = Math.min(colors.length, this.quality.maxLights);
            
            for (let i = 0; i < maxLights; i++) {
                const pointLight = new THREE.PointLight(colors[i], 1, 20);
                pointLight.position.set(
                    Math.random() * 40 - 20,
                    Math.random() * 5 + 2,
                    Math.random() * 40 - 20
                );
                this.scene.add(pointLight);
            }
        }
    }
    
    loadAssets() {
        // Load textures, models, and sounds
        // This will be handled by the AssetLoader class
        this.assetLoader.loadTextures();
        this.assetLoader.loadModels();
        this.assetLoader.loadSounds();
        
        // Load a dummy resource to ensure the loadingManager fires the onLoad event
        const textureLoader = new THREE.TextureLoader(this.loadingManager);
        textureLoader.load(
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
            () => console.log('Dummy texture loaded'),
            undefined,
            (error) => console.warn('Error loading dummy texture:', error)
        );
    }
    
    startGame() {
        console.log('Starting game initialization');
        
        // Initialize player
        this.player = new Player(this.scene, this.camera, this.inputHandler, this.assetLoader);
        console.log('Player initialized');
        
        // Initialize game
        this.game = new Game(this.scene, this.camera, this.player, this.ui, this.inputHandler, this.assetLoader);
        console.log('Game initialized');
        
        // Expose game instance globally
        window.game = this.game;
        
        // Explicitly call setupClassSelection to ensure it's called
        console.log('Explicitly calling setupClassSelection');
        this.game.setupClassSelection();
        
        // Start background music if available (commented out to avoid errors)
        // This can be uncommented when real sounds are available
        /*
        if (this.assetLoader.sounds['bgm']) {
            this.assetLoader.playSound('bgm');
        }
        */
        
        // Start animation loop
        console.log('Starting animation loop');
        this.animate();
        
        console.log('Game initialization complete');
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        try {
            // Only update if game exists
            if (this.game) {
                const deltaTime = Math.min(0.05, this.game.clock.getDelta());
                
                // Update game
                this.game.update(deltaTime);
            }
            
            // Render scene
            this.renderer.render(this.scene, this.camera);
        } catch (error) {
            console.error('Error in animation loop:', error);
            // Continue the animation loop despite errors
        }
    }
}

// Initialize the game when the DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    new Main();
}); 