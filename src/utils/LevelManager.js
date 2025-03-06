import { Level } from '../components/Level.js';

export class LevelManager {
    constructor(scene, assetLoader) {
        this.scene = scene;
        this.assetLoader = assetLoader;
        
        // Level data
        this.levels = [];
        this.currentLevelIndex = 0;
        this.currentLevel = null;
        
        // Initialize levels
        this.initializeLevels();
    }
    
    initializeLevels() {
        // Define level configurations
        const levelConfigs = [
            {
                name: "Floresta Encantada",
                difficulty: "Fácil",
                description: "Uma floresta mágica com plataformas básicas e poucos inimigos.",
                platformCount: 15,
                collectibleCount: { crystals: 10, seeds: 5 },
                enemyCount: 3,
                specialFeatures: []
            },
            {
                name: "Cavernas Cristalinas",
                difficulty: "Médio",
                description: "Cavernas brilhantes com plataformas móveis e mais inimigos.",
                platformCount: 20,
                collectibleCount: { crystals: 15, seeds: 8 },
                enemyCount: 5,
                specialFeatures: ["movingPlatforms"]
            },
            {
                name: "Picos Flutuantes",
                difficulty: "Difícil",
                description: "Ilhas flutuantes no céu com plataformas que desaparecem e muitos inimigos.",
                platformCount: 25,
                collectibleCount: { crystals: 20, seeds: 10 },
                enemyCount: 8,
                specialFeatures: ["movingPlatforms", "disappearingPlatforms"]
            }
        ];
        
        // Create level objects
        this.levels = levelConfigs.map(config => ({
            config: config,
            instance: null // Will be instantiated when needed
        }));
    }
    
    loadLevel(index) {
        // Validate index
        if (index < 0 || index >= this.levels.length) {
            console.error(`Level index ${index} is out of bounds`);
            return false;
        }
        
        // Unload current level if exists
        if (this.currentLevel) {
            this.currentLevel.unload();
        }
        
        // Set current level index
        this.currentLevelIndex = index;
        
        // Create level instance if not already created
        if (!this.levels[index].instance) {
            this.levels[index].instance = new Level(
                this.scene, 
                this.assetLoader,
                this.levels[index].config
            );
        }
        
        // Set current level
        this.currentLevel = this.levels[index].instance;
        
        // Load level
        this.currentLevel.load();
        
        return true;
    }
    
    getCurrentLevel() {
        return this.currentLevel;
    }
    
    getNextLevelIndex() {
        return (this.currentLevelIndex + 1) % this.levels.length;
    }
    
    loadNextLevel() {
        return this.loadLevel(this.getNextLevelIndex());
    }
    
    resetCurrentLevel() {
        if (this.currentLevel) {
            this.currentLevel.reset();
            return true;
        }
        return false;
    }
    
    getLevelCount() {
        return this.levels.length;
    }
    
    getLevelInfo(index) {
        if (index >= 0 && index < this.levels.length) {
            return this.levels[index].config;
        }
        return null;
    }
    
    getCurrentLevelInfo() {
        return this.getLevelInfo(this.currentLevelIndex);
    }
} 