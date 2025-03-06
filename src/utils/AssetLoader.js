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
        this.audioAvailable = false;
        
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
                this.audioAvailable = true;
                
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
                this.audioAvailable = false;
            }
        } catch (error) {
            console.error('Error initializing audio:', error);
            this.audioAvailable = false;
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
        
        // Use fallback textures for all defined textures
        for (const [name, path] of Object.entries(textureFiles)) {
            // Set fallback texture immediately
            this.textures[name] = this.fallbackTextures[name];
            console.log(`Using fallback for texture: ${name}`);
            
            // Optionally try to load the real texture (commented out to avoid errors)
            // This can be uncommented when real textures are available
            /*
            try {
                this.textureLoader.load(
                    path,
                    (texture) => {
                        texture.wrapS = THREE.RepeatWrapping;
                        texture.wrapT = THREE.RepeatWrapping;
                        texture.repeat.set(1, 1);
                        this.textures[name] = texture;
                        console.log(`Loaded texture: ${name}`);
                    },
                    undefined,
                    (error) => {
                        console.warn(`Using fallback for texture: ${name}`);
                        this.textures[name] = this.fallbackTextures[name];
                    }
                );
            } catch (error) {
                console.warn(`Error loading texture ${name}, using fallback`);
                this.textures[name] = this.fallbackTextures[name];
            }
            */
        }
    }
    
    loadModels() {
        // Placeholder for loading 3D models
        console.log('Model loading not implemented yet');
    }
    
    loadSounds() {
        // Check if audio is supported
        if (!this.audioAvailable) {
            console.warn('Audio not supported or disabled, skipping sound loading');
            return;
        }
        
        // Define sound files (for reference only, not actually loading them)
        const soundFiles = {
            // Player sounds
            'playerJump': '/audio/player_jump.mp3',
            'playerLand': '/audio/player_land.mp3',
            'playerDamage': '/audio/player_damage.mp3',
            'playerFly': '/audio/player_fly.mp3',
            
            // Attack sounds - general
            'attackSwing': '/audio/attack_swing.mp3',
            'attackHit': '/audio/attack_hit.mp3',
            
            // Attack sounds - class specific
            'swordSwing': '/audio/sword_swing.mp3',
            'bowShot': '/audio/bow_shot.mp3',
            'magicCast': '/audio/magic_cast.mp3',
            'arrowHit': '/audio/arrow_hit.mp3',
            'spellHit': '/audio/spell_hit.mp3',
            
            // Enemy sounds
            'enemyDetect': '/audio/enemy_detect.mp3',
            'enemyAttack': '/audio/enemy_attack.mp3',
            'enemyDeath': '/audio/enemy_death.mp3',
            
            // Collectible sounds
            'collectCrystal': '/audio/collect_crystal.mp3',
            'collectSeed': '/audio/collect_seed.mp3',
            
            // UI sounds
            'buttonClick': '/audio/button_click.mp3',
            'levelComplete': '/audio/level_complete.mp3',
            'gameOver': '/audio/game_over.mp3',
            'classSelected': '/audio/class_selected.mp3',
            
            // Background music
            'bgm': '/audio/background_music.mp3'
        };
        
        // Create a silent buffer as fallback
        const createSilentBuffer = () => {
            const buffer = this.audioContext.createBuffer(1, 1, 22050);
            const sound = new THREE.Audio(this.audioListener);
            sound.setBuffer(buffer);
            return sound;
        };
        
        // Create silent sounds for all defined sounds
        for (const name of Object.keys(soundFiles)) {
            this.sounds[name] = createSilentBuffer();
            console.log(`Created silent sound for: ${name}`);
        }
        
        // Optionally try to load the real sounds (commented out to avoid errors)
        // This can be uncommented when real sounds are available
        /*
        // Try to load each sound
        for (const [name, path] of Object.entries(soundFiles)) {
            try {
                // Load and set the audio
                audioLoader.load(
                    path,
                    (buffer) => {
                        const sound = new THREE.Audio(this.audioListener);
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
                        console.warn(`Using silent fallback for sound: ${name}`);
                        // Silent fallback already created
                    }
                );
            } catch (error) {
                console.error(`Error setting up sound ${name}:`, error);
                // Silent fallback already created
            }
        }
        */
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
        // Skip if audio is not available
        if (!this.audioAvailable) {
            return;
        }
        
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