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
        this.controlsDisplay = document.getElementById('controls-display');
        this.classSelectionScreen = document.getElementById('class-selection-screen');
        this.classIcon = document.getElementById('class-icon');
        
        // Class selection callback
        this.onClassSelected = null;
        
        // Setup event listeners for key tips
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for key tip events
        window.addEventListener('showKeyTip', (event) => {
            this.showKeyTip(event.detail.key, event.detail.description);
        });
        
        // Setup class selection buttons
        const selectButtons = document.querySelectorAll('.select-button');
        selectButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const classCard = event.target.closest('.class-card');
                const selectedClass = classCard.dataset.class;
                this.selectClass(selectedClass);
            });
        });
        
        // Add hover effect to class cards
        const classCards = document.querySelectorAll('.class-card');
        classCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                // Remove selected class from all cards
                classCards.forEach(c => c.classList.remove('selected'));
                // Add selected class to hovered card
                card.classList.add('selected');
            });
            
            card.addEventListener('mouseleave', () => {
                card.classList.remove('selected');
            });
        });
    }
    
    updateLoadingProgress(progress) {
        this.progressBar.style.width = `${progress}%`;
        this.loadingText.textContent = `Loading... ${Math.round(progress)}%`;
    }
    
    hideLoadingScreen() {
        this.loadingScreen.style.opacity = '0';
        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
            // Show class selection screen after loading
            console.log('Showing class selection screen');
            this.showClassSelection();
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
    
    showKeyTip(key, description) {
        // Find the corresponding control icon
        let controlIcon;
        
        switch(key) {
            case 'forward':
            case 'backward':
            case 'left':
            case 'right':
                controlIcon = this.controlsDisplay.querySelector('.control-icon:nth-child(1)'); // WASD
                break;
            case 'jump':
                controlIcon = this.controlsDisplay.querySelector('.control-icon:nth-child(2)'); // SPACE
                break;
            case 'sprint':
                controlIcon = this.controlsDisplay.querySelector('.control-icon:nth-child(3)'); // SHIFT
                break;
            case 'action':
                controlIcon = this.controlsDisplay.querySelector('.control-icon:nth-child(4)'); // E
                break;
            case 'attack':
                controlIcon = this.controlsDisplay.querySelector('.control-icon:nth-child(5)'); // Q
                break;
        }
        
        if (controlIcon) {
            // Highlight the control icon
            controlIcon.classList.add('highlight');
            
            // Show the tip
            this.showMessage(`${description}`, 3000);
            
            // Remove highlight after a delay
            setTimeout(() => {
                controlIcon.classList.remove('highlight');
            }, 3000);
        }
    }
    
    // Add new methods for class selection
    showClassSelection() {
        console.log('showClassSelection called');
        if (this.classSelectionScreen) {
            console.log('Class selection screen exists, showing it');
            this.classSelectionScreen.style.display = 'flex';
        } else {
            console.error('Class selection screen not found');
        }
    }
    
    hideClassSelection() {
        console.log('hideClassSelection called');
        if (this.classSelectionScreen) {
            this.classSelectionScreen.style.display = 'none';
        } else {
            console.error('Class selection screen not found');
        }
    }
    
    selectClass(className) {
        console.log(`selectClass called with className: ${className}`);
        
        // Update class icon
        if (this.classIcon) {
            this.classIcon.className = '';
            this.classIcon.classList.add(className);
        } else {
            console.error('Class icon element not found');
        }
        
        // Hide class selection screen
        this.hideClassSelection();
        
        // Play class selection sound
        if (window.game && window.game.player && window.game.player.assetLoader) {
            console.log('Playing class selection sound');
            window.game.player.assetLoader.playSound('classSelected');
        } else {
            console.warn('Game, player, or assetLoader not available for playing sound');
        }
        
        // Call the callback if it exists
        if (this.onClassSelected) {
            console.log('Calling onClassSelected callback');
            this.onClassSelected(className);
        } else {
            console.error('No onClassSelected callback set');
        }
        
        // Show message
        this.showMessage(`You selected the ${className.charAt(0).toUpperCase() + className.slice(1)} class!`, 3000);
    }
    
    setClassSelectionCallback(callback) {
        console.log('setClassSelectionCallback called');
        this.onClassSelected = callback;
    }
}