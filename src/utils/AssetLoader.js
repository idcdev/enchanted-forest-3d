import * as THREE from 'three';

export class AssetLoader {
    constructor(loadingManager) {
        this.loadingManager = loadingManager;
        
        // Asset containers
        this.textures = {};
        this.models = {};
        this.sounds = {};
        
        // Create loaders
        this.textureLoader = new THREE.TextureLoader(this.loadingManager);
        
        // Audio context
        this.audioContext = null;
        this.audioListener = null;
        
        // Initialize audio if browser supports it
        this.initAudio();
        
        // Create fallback textures
        this.createFallbackTextures();
    }
    
    initAudio() {
        try {
            // Check if AudioContext is supported
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            
            if (window.AudioContext) {
                this.audioContext = new AudioContext();
                this.audioListener = new THREE.AudioListener();
                
                // Resume audio context on user interaction (required by browsers)
                const resumeAudio = () => {
                    if (this.audioContext && this.audioContext.state === 'suspended') {
                        this.audioContext.resume();
                    }
                    
                    // Remove event listeners once audio is resumed
                    document.removeEventListener('click', resumeAudio);
                    document.removeEventListener('keydown', resumeAudio);
                };
                
                document.addEventListener('click', resumeAudio);
                document.addEventListener('keydown', resumeAudio);
                
                console.log('Audio system initialized');
            } else {
                console.warn('AudioContext not supported in this browser');
            }
        } catch (error) {
            console.error('Error initializing audio:', error);
        }
    }
    
    createFallbackTextures() {
        // Create a simple color texture for each type
        const createColorTexture = (color) => {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 64, 64);
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 1);
            return texture;
        };
        
        // Create fallback textures
        this.fallbackTextures = {
            grass: createColorTexture('#4CAF50'),
            dirt: createColorTexture('#795548'),
            bark: createColorTexture('#5D4037'),
            leaves: createColorTexture('#81C784'),
            crystal: createColorTexture('#2196F3'),
            seed: createColorTexture('#FFC107')
        };
    }
    
    loadTextures() {
        const textureFiles = {
            grass: '/textures/grass.jpg',
            dirt: '/textures/dirt.jpg',
            bark: '/textures/bark.jpg',
            leaves: '/textures/leaves.jpg',
            crystal: '/textures/crystal.jpg',
            seed: '/textures/seed.jpg'
        };
        
        // Load each texture with fallback
        for (const [name, path] of Object.entries(textureFiles)) {
            this.textureLoader.load(
                path,
                (texture) => {
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(1, 1);
                    this.textures[name] = texture;
                },
                undefined,
                () => {
                    // Error loading texture, use fallback
                    console.warn(`Using fallback for texture: ${name}`);
                    this.textures[name] = this.fallbackTextures[name];
                }
            );
        }
    }
    
    loadModels() {
        // In a full game, this would load 3D models using GLTFLoader
        // For now, we're using simple geometries created in the component classes
    }
    
    loadSounds() {
        if (!this.audioListener) {
            console.warn('Audio system not initialized, skipping sound loading');
            return;
        }
        
        const audioLoader = new THREE.AudioLoader(this.loadingManager);
        
        // Define sounds to load
        const soundFiles = {
            // Background music
            'bgm': '/audio/background_music.mp3',
            
            // Player sounds
            'jump': '/audio/jump.mp3',
            'doubleJump': '/audio/double_jump.mp3',
            'fly': '/audio/fly.mp3',
            'land': '/audio/land.mp3',
            'damage': '/audio/damage.mp3',
            
            // Collectible sounds
            'collectCrystal': '/audio/collect_crystal.mp3',
            'collectSeed': '/audio/collect_seed.mp3',
            
            // Enemy sounds
            'enemyDetect': '/audio/enemy_detect.mp3',
            'enemyAttack': '/audio/enemy_attack.mp3',
            
            // UI sounds
            'buttonClick': '/audio/button_click.mp3',
            'levelComplete': '/audio/level_complete.mp3',
            'gameOver': '/audio/game_over.mp3'
        };
        
        // Create a silent buffer as fallback
        const createSilentBuffer = () => {
            const buffer = this.audioContext.createBuffer(1, 1, 22050);
            const sound = new THREE.Audio(this.audioListener);
            sound.setBuffer(buffer);
            return sound;
        };
        
        // Load each sound
        for (const [name, path] of Object.entries(soundFiles)) {
            // Create a buffer for this sound
            const sound = new THREE.Audio(this.audioListener);
            
            // Load and set the audio
            audioLoader.load(
                path,
                (buffer) => {
                    sound.setBuffer(buffer);
                    sound.setVolume(0.5); // Default volume
                    
                    // Set loop for background music
                    if (name === 'bgm') {
                        sound.setLoop(true);
                        sound.setVolume(0.3); // Lower volume for background music
                    }
                    
                    this.sounds[name] = sound;
                    console.log(`Loaded sound: ${name}`);
                },
                (xhr) => {
                    // Progress callback
                    console.log(`${name} ${(xhr.loaded / xhr.total * 100).toFixed(0)}% loaded`);
                },
                (error) => {
                    // Error callback
                    console.error(`Error loading sound ${name}:`, error);
                    
                    // Create a silent buffer as fallback
                    this.sounds[name] = createSilentBuffer();
                    console.warn(`Using silent fallback for sound: ${name}`);
                }
            );
        }
    }
    
    getTexture(name) {
        if (!this.textures[name]) {
            console.warn(`Texture "${name}" not found, using fallback`);
            return this.fallbackTextures[name] || this.fallbackTextures.grass;
        }
        return this.textures[name];
    }
    
    getModel(name) {
        return this.models[name];
    }
    
    playSound(name, options = {}) {
        if (!this.sounds[name]) {
            console.warn(`Sound "${name}" not found`);
            return;
        }
        
        const sound = this.sounds[name];
        
        // Set options
        if (options.volume !== undefined) {
            sound.setVolume(options.volume);
        }
        
        if (options.detune !== undefined) {
            sound.detune = options.detune;
        }
        
        // Don't restart already playing sounds unless forced
        if (sound.isPlaying && !options.force) {
            return;
        }
        
        try {
            // Play the sound
            sound.play();
        } catch (error) {
            console.warn(`Error playing sound "${name}":`, error);
        }
    }
    
    stopSound(name) {
        if (this.sounds[name] && this.sounds[name].isPlaying) {
            try {
                this.sounds[name].stop();
            } catch (error) {
                console.warn(`Error stopping sound "${name}":`, error);
            }
        }
    }
    
    stopAllSounds() {
        for (const sound of Object.values(this.sounds)) {
            if (sound.isPlaying) {
                try {
                    sound.stop();
                } catch (error) {
                    console.warn('Error stopping sound:', error);
                }
            }
        }
    }
    
    getAudioListener() {
        return this.audioListener;
    }
} 