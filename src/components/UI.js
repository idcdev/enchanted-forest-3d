export class UI {
    constructor() {
        // UI elements
        this.loadingScreen = document.getElementById('loading-screen');
        this.progressBar = document.getElementById('progress-bar');
        this.loadingText = document.getElementById('loading-text');
        this.crystalCount = document.getElementById('crystal-count');
        this.seedCount = document.getElementById('seed-count');
        this.healthBar = document.getElementById('health-bar');
        this.fuelBar = document.getElementById('fuel-bar');
        this.gameOverScreen = document.getElementById('game-over');
        this.levelCompleteScreen = document.getElementById('level-complete');
        this.finalCrystals = document.getElementById('final-crystals');
        this.finalSeeds = document.getElementById('final-seeds');
    }
    
    updateLoadingProgress(progress) {
        this.progressBar.style.width = `${progress}%`;
        this.loadingText.textContent = `Loading... ${Math.round(progress)}%`;
    }
    
    hideLoadingScreen() {
        this.loadingScreen.style.opacity = '0';
        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
        }, 1000);
    }
    
    updateScore(crystals, seeds) {
        this.crystalCount.textContent = crystals;
        this.seedCount.textContent = seeds;
    }
    
    updateHealth(health) {
        this.healthBar.style.width = `${health}%`;
        
        // Change health bar color based on health
        if (health > 70) {
            this.healthBar.style.backgroundColor = '#4caf50'; // Green
        } else if (health > 30) {
            this.healthBar.style.backgroundColor = '#ff9800'; // Orange
        } else {
            this.healthBar.style.backgroundColor = '#f44336'; // Red
        }
    }
    
    updateFuel(currentFuel, maxFuel) {
        // Calculate fuel percentage
        const fuelPercentage = (currentFuel / maxFuel) * 100;
        
        // Update fuel bar width
        this.fuelBar.style.width = `${fuelPercentage}%`;
        
        // Change fuel bar color based on fuel level
        if (fuelPercentage > 70) {
            this.fuelBar.style.backgroundColor = '#3498db'; // Blue
        } else if (fuelPercentage > 30) {
            this.fuelBar.style.backgroundColor = '#9b59b6'; // Purple
        } else {
            this.fuelBar.style.backgroundColor = '#e74c3c'; // Red
        }
        
        // Add pulsing effect when fuel is low
        if (fuelPercentage < 20) {
            this.fuelBar.classList.add('pulse');
        } else {
            this.fuelBar.classList.remove('pulse');
        }
    }
    
    showGameOver() {
        this.gameOverScreen.classList.add('active');
    }
    
    hideGameOver() {
        this.gameOverScreen.classList.remove('active');
    }
    
    showLevelComplete(crystals, seeds) {
        this.finalCrystals.textContent = crystals;
        this.finalSeeds.textContent = seeds;
        this.levelCompleteScreen.classList.add('active');
    }
    
    hideLevelComplete() {
        this.levelCompleteScreen.classList.remove('active');
    }
    
    showMessage(message, duration = 3000) {
        // Create a temporary message element
        const messageElement = document.createElement('div');
        messageElement.className = 'game-message';
        messageElement.textContent = message;
        
        // Add to DOM
        document.getElementById('game-container').appendChild(messageElement);
        
        // Animate in
        setTimeout(() => {
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
        }, 10);
        
        // Remove after duration
        setTimeout(() => {
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'translateY(-20px)';
            
            // Remove from DOM after animation
            setTimeout(() => {
                messageElement.remove();
            }, 500);
        }, duration);
    }
}