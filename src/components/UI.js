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
        console.log('UI.hideLoadingScreen called');
        
        if (!this.loadingScreen) {
            console.error('Loading screen element not found');
            return;
        }
        
        this.loadingScreen.style.opacity = '0';
        
        setTimeout(() => {
            console.log('Hiding loading screen and showing class selection');
            this.loadingScreen.style.display = 'none';
            
            // Verify that the class selection screen exists
            if (!this.classSelectionScreen) {
                console.error('Class selection screen element not found, trying to get it again');
                this.classSelectionScreen = document.getElementById('class-selection-screen');
                
                if (!this.classSelectionScreen) {
                    console.error('Still could not find class selection screen element');
                    // Try to create it dynamically as a last resort
                    this.createClassSelectionScreen();
                    return;
                }
            }
            
            // Show class selection screen
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
    
    // Add a method to create the class selection screen dynamically if it doesn't exist
    createClassSelectionScreen() {
        console.log('Creating class selection screen dynamically');
        
        // Create the class selection screen element
        const classSelectionScreen = document.createElement('div');
        classSelectionScreen.id = 'class-selection-screen';
        classSelectionScreen.style.position = 'absolute';
        classSelectionScreen.style.top = '0';
        classSelectionScreen.style.left = '0';
        classSelectionScreen.style.width = '100%';
        classSelectionScreen.style.height = '100%';
        classSelectionScreen.style.backgroundColor = 'rgba(26, 42, 58, 0.9)';
        classSelectionScreen.style.display = 'flex';
        classSelectionScreen.style.justifyContent = 'center';
        classSelectionScreen.style.alignItems = 'center';
        classSelectionScreen.style.zIndex = '90';
        
        // Create the content container
        const selectionContent = document.createElement('div');
        selectionContent.className = 'selection-content';
        selectionContent.style.textAlign = 'center';
        selectionContent.style.color = '#fff';
        selectionContent.style.maxWidth = '900px';
        selectionContent.style.padding = '20px';
        
        // Create the title
        const title = document.createElement('h1');
        title.textContent = 'Choose Your Class';
        title.style.fontSize = '2.5rem';
        title.style.marginBottom = '2rem';
        title.style.textShadow = '0 0 10px rgba(144, 238, 144, 0.8)';
        
        // Create the class options container
        const classOptions = document.createElement('div');
        classOptions.className = 'class-options';
        classOptions.style.display = 'flex';
        classOptions.style.justifyContent = 'center';
        classOptions.style.gap = '20px';
        classOptions.style.flexWrap = 'wrap';
        
        // Create class cards
        const classes = [
            {
                name: 'warrior',
                title: 'Warrior',
                description: 'Powerful melee attacks with a sword',
                features: ['High damage up close', 'Strong defense', 'Slower movement'],
                color: '#f44336'
            },
            {
                name: 'archer',
                title: 'Archer',
                description: 'Ranged attacks with a bow',
                features: ['Attack from distance', 'Fast movement', 'Lower defense'],
                color: '#4caf50'
            },
            {
                name: 'mage',
                title: 'Mage',
                description: 'Magical area attacks',
                features: ['Area damage', 'Special abilities', 'Low defense'],
                color: '#3f51b5'
            }
        ];
        
        classes.forEach(classInfo => {
            // Create class card
            const classCard = document.createElement('div');
            classCard.className = 'class-card';
            classCard.dataset.class = classInfo.name;
            classCard.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            classCard.style.border = '2px solid #90ee90';
            classCard.style.borderRadius = '10px';
            classCard.style.padding = '20px';
            classCard.style.width = '250px';
            classCard.style.transition = 'all 0.3s ease';
            classCard.style.cursor = 'pointer';
            
            // Create class icon
            const classIcon = document.createElement('div');
            classIcon.className = `class-icon ${classInfo.name}`;
            classIcon.style.width = '80px';
            classIcon.style.height = '80px';
            classIcon.style.margin = '0 auto 15px';
            classIcon.style.borderRadius = '50%';
            classIcon.style.backgroundColor = classInfo.color;
            classIcon.style.display = 'flex';
            classIcon.style.justifyContent = 'center';
            classIcon.style.alignItems = 'center';
            classIcon.style.position = 'relative';
            
            // Add icon content
            const iconContent = document.createElement('span');
            iconContent.style.fontSize = '40px';
            
            if (classInfo.name === 'warrior') {
                iconContent.textContent = '⚔️';
            } else if (classInfo.name === 'archer') {
                iconContent.textContent = '🏹';
            } else if (classInfo.name === 'mage') {
                iconContent.textContent = '✨';
            }
            
            classIcon.appendChild(iconContent);
            
            // Create class title
            const classTitle = document.createElement('h3');
            classTitle.textContent = classInfo.title;
            classTitle.style.fontSize = '1.5rem';
            classTitle.style.marginBottom = '10px';
            classTitle.style.color = '#90ee90';
            
            // Create class description
            const classDescription = document.createElement('p');
            classDescription.textContent = classInfo.description;
            classDescription.style.fontSize = '0.9rem';
            classDescription.style.marginBottom = '15px';
            classDescription.style.color = '#ddd';
            
            // Create features list
            const featuresList = document.createElement('ul');
            featuresList.style.textAlign = 'left';
            featuresList.style.marginBottom = '20px';
            featuresList.style.paddingLeft = '20px';
            
            classInfo.features.forEach(feature => {
                const featureItem = document.createElement('li');
                featureItem.textContent = feature;
                featureItem.style.fontSize = '0.8rem';
                featureItem.style.marginBottom = '5px';
                featureItem.style.color = '#bbb';
                featuresList.appendChild(featureItem);
            });
            
            // Create select button
            const selectButton = document.createElement('button');
            selectButton.className = 'select-button';
            selectButton.textContent = 'Select';
            selectButton.style.backgroundColor = '#90ee90';
            selectButton.style.color = '#000';
            selectButton.style.border = 'none';
            selectButton.style.padding = '8px 20px';
            selectButton.style.borderRadius = '5px';
            selectButton.style.fontSize = '1rem';
            selectButton.style.cursor = 'pointer';
            selectButton.style.transition = 'all 0.2s ease';
            
            // Add event listener to select button
            selectButton.addEventListener('click', () => {
                console.log(`Class selected: ${classInfo.name}`);
                this.selectClass(classInfo.name);
            });
            
            // Add hover effect to select button
            selectButton.addEventListener('mouseenter', () => {
                selectButton.style.backgroundColor = '#7ccc7c';
                selectButton.style.transform = 'scale(1.05)';
            });
            
            selectButton.addEventListener('mouseleave', () => {
                selectButton.style.backgroundColor = '#90ee90';
                selectButton.style.transform = 'scale(1)';
            });
            
            // Add hover effect to class card
            classCard.addEventListener('mouseenter', () => {
                classCard.style.transform = 'translateY(-10px)';
                classCard.style.boxShadow = '0 10px 20px rgba(144, 238, 144, 0.3)';
                classCard.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            });
            
            classCard.addEventListener('mouseleave', () => {
                classCard.style.transform = 'translateY(0)';
                classCard.style.boxShadow = 'none';
                classCard.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            });
            
            // Assemble class card
            classCard.appendChild(classIcon);
            classCard.appendChild(classTitle);
            classCard.appendChild(classDescription);
            classCard.appendChild(featuresList);
            classCard.appendChild(selectButton);
            
            // Add class card to options
            classOptions.appendChild(classCard);
        });
        
        // Assemble selection content
        selectionContent.appendChild(title);
        selectionContent.appendChild(classOptions);
        
        // Assemble class selection screen
        classSelectionScreen.appendChild(selectionContent);
        
        // Add to DOM
        document.getElementById('game-container').appendChild(classSelectionScreen);
        
        // Store reference
        this.classSelectionScreen = classSelectionScreen;
        
        console.log('Class selection screen created dynamically');
    }
    
    setupUI() {
        // Create UI elements
        this.createScoreDisplay();
        this.createHealthBar();
        this.createFuelBar();
        this.createControlsDisplay();
        this.createPauseMenu();
        this.createGameOverScreen();
        this.createLevelCompleteScreen();
        this.createLevelInfoDisplay();
        
        // Add quality settings button to pause menu
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu) {
            const settingsButton = document.createElement('button');
            settingsButton.textContent = 'Configurações Gráficas';
            settingsButton.classList.add('menu-button');
            settingsButton.addEventListener('click', () => this.showQualitySettings());
            pauseMenu.appendChild(settingsButton);
        }
    }
    
    // Add quality settings menu
    showQualitySettings() {
        // Hide pause menu
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu) {
            pauseMenu.style.display = 'none';
        }
        
        // Create settings menu if it doesn't exist
        let settingsMenu = document.getElementById('settings-menu');
        if (!settingsMenu) {
            settingsMenu = document.createElement('div');
            settingsMenu.id = 'settings-menu';
            settingsMenu.classList.add('menu');
            document.getElementById('ui-container').appendChild(settingsMenu);
            
            const title = document.createElement('h2');
            title.textContent = 'Configurações Gráficas';
            settingsMenu.appendChild(title);
            
            // Quality options
            const qualityOptions = ['low', 'medium', 'high'];
            const qualityLabels = {
                'low': 'Baixa (Melhor Desempenho)',
                'medium': 'Média (Equilibrado)',
                'high': 'Alta (Melhor Visual)'
            };
            
            // Get current quality
            const currentQuality = localStorage.getItem('gameQuality') || 'medium';
            
            // Create radio buttons for each quality option
            qualityOptions.forEach(quality => {
                const container = document.createElement('div');
                container.classList.add('quality-option');
                
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = 'quality';
                radio.value = quality;
                radio.id = `quality-${quality}`;
                radio.checked = quality === currentQuality;
                
                const label = document.createElement('label');
                label.htmlFor = `quality-${quality}`;
                label.textContent = qualityLabels[quality];
                
                container.appendChild(radio);
                container.appendChild(label);
                settingsMenu.appendChild(container);
            });
            
            // Apply button
            const applyButton = document.createElement('button');
            applyButton.textContent = 'Aplicar';
            applyButton.classList.add('menu-button');
            applyButton.addEventListener('click', () => {
                const selectedQuality = document.querySelector('input[name="quality"]:checked').value;
                localStorage.setItem('gameQuality', selectedQuality);
                alert('As configurações serão aplicadas após reiniciar o jogo.');
                this.hideQualitySettings();
            });
            settingsMenu.appendChild(applyButton);
            
            // Back button
            const backButton = document.createElement('button');
            backButton.textContent = 'Voltar';
            backButton.classList.add('menu-button');
            backButton.addEventListener('click', () => this.hideQualitySettings());
            settingsMenu.appendChild(backButton);
        }
        
        // Show settings menu
        settingsMenu.style.display = 'flex';
    }
    
    hideQualitySettings() {
        // Hide settings menu
        const settingsMenu = document.getElementById('settings-menu');
        if (settingsMenu) {
            settingsMenu.style.display = 'none';
        }
        
        // Show pause menu
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu) {
            pauseMenu.style.display = 'flex';
        }
    }
}