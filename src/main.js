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
        // Setup loading screen
        this.loadingManager = new THREE.LoadingManager();
        this.setupLoadingManager();
        
        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
    }
    
    setupLoadingManager() {
        const progressBar = document.getElementById('progress-bar');
        const loadingText = document.getElementById('loading-text');
        const loadingScreen = document.getElementById('loading-screen');
        
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal) * 100;
            progressBar.style.width = progress + '%';
            loadingText.textContent = `Loading... ${Math.round(progress)}%`;
        };
        
        this.loadingManager.onLoad = () => {
            loadingText.textContent = 'Loading complete!';
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    this.startGame();
                }, 1000);
            }, 1000);
        };
        
        this.loadingManager.onError = (url) => {
            console.error('Error loading asset:', url);
            loadingText.textContent = 'Error loading assets. Please refresh the page.';
        };
    }
    
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x6688cc, 0.5);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffbb, 1);
        directionalLight.position.set(60, 100, 40);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.near = 1;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Add some point lights for magical atmosphere
        const colors = [0x88ff88, 0xffaa88, 0x8888ff];
        for (let i = 0; i < 3; i++) {
            const pointLight = new THREE.PointLight(colors[i], 1, 20);
            pointLight.position.set(
                Math.random() * 40 - 20,
                Math.random() * 5 + 2,
                Math.random() * 40 - 20
            );
            this.scene.add(pointLight);
        }
    }
    
    loadAssets() {
        // Load textures, models, and sounds
        // This will be handled by the AssetLoader class
        this.assetLoader.loadTextures();
        this.assetLoader.loadModels();
        this.assetLoader.loadSounds();
    }
    
    startGame() {
        // Initialize player
        this.player = new Player(this.scene, this.camera, this.inputHandler, this.assetLoader);
        
        // Initialize game
        this.game = new Game(this.scene, this.camera, this.player, this.ui, this.inputHandler, this.assetLoader);
        
        // Expose game instance globally
        window.game = this.game;
        
        // Start background music
        this.assetLoader.playSound('bgm');
        
        // Start animation loop
        this.animate();
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const deltaTime = Math.min(0.05, this.game.clock.getDelta());
        
        // Update game
        this.game.update(deltaTime);
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the game when the DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    new Main();
}); 