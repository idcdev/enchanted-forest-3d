export class InputHandler {
    constructor() {
        // Input state
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            sprint: false,
            action: false,
            attack: false
        };
        
        // Track which keys have been used
        this.keyUsed = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            sprint: false,
            action: false,
            attack: false
        };
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Keyboard down event
        window.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });
        
        // Keyboard up event
        window.addEventListener('keyup', (event) => {
            this.handleKeyUp(event);
        });
        
        // Handle losing focus
        window.addEventListener('blur', () => {
            this.resetKeys();
        });
    }
    
    handleKeyDown(event) {
        // Prevent default behavior for game controls
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' ', 'Shift', 'e', 'E', 'q', 'Q'].includes(event.key)) {
            event.preventDefault();
        }
        
        // Update key states
        switch (event.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.keys.forward = true;
                this.showKeyTip('forward', 'Move Forward');
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.keys.backward = true;
                this.showKeyTip('backward', 'Move Backward');
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.keys.left = true;
                this.showKeyTip('left', 'Move Left');
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.keys.right = true;
                this.showKeyTip('right', 'Move Right');
                break;
            case ' ':
                this.keys.jump = true;
                this.showKeyTip('jump', 'Fly (Hold to activate flight)');
                break;
            case 'Shift':
                this.keys.sprint = true;
                this.showKeyTip('sprint', 'Sprint (Hold to run faster)');
                break;
            case 'e':
            case 'E':
                this.keys.action = true;
                this.showKeyTip('action', 'Dash (Quick burst of speed)');
                break;
            case 'q':
            case 'Q':
                this.keys.attack = true;
                this.showKeyTip('attack', 'Attack (Damage enemies in front)');
                break;
        }
    }
    
    handleKeyUp(event) {
        // Update key states
        switch (event.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.keys.forward = false;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.keys.backward = false;
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.keys.left = false;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.keys.right = false;
                break;
            case ' ':
                this.keys.jump = false;
                break;
            case 'Shift':
                this.keys.sprint = false;
                break;
            case 'e':
            case 'E':
                this.keys.action = false;
                break;
            case 'q':
            case 'Q':
                this.keys.attack = false;
                break;
        }
    }
    
    resetKeys() {
        // Reset all keys to false
        Object.keys(this.keys).forEach(key => {
            this.keys[key] = false;
        });
    }
    
    getInput() {
        // Return a copy of the current input state
        return { ...this.keys };
    }
    
    // Add new method to show key tips
    showKeyTip(key, description) {
        // Only show tip if this is the first time the key is used
        if (!this.keyUsed[key]) {
            this.keyUsed[key] = true;
            
            // Create a custom event for the UI to show a tip
            const tipEvent = new CustomEvent('showKeyTip', {
                detail: {
                    key: key,
                    description: description
                }
            });
            window.dispatchEvent(tipEvent);
        }
    }
} 