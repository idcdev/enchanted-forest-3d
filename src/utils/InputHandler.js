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
            action: false
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
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' ', 'Shift'].includes(event.key)) {
            event.preventDefault();
        }
        
        switch (event.key) {
            case 'ArrowUp':
            case 'w':
                this.keys.forward = true;
                break;
            case 'ArrowDown':
            case 's':
                this.keys.backward = true;
                break;
            case 'ArrowLeft':
            case 'a':
                this.keys.left = true;
                break;
            case 'ArrowRight':
            case 'd':
                this.keys.right = true;
                break;
            case ' ':
                this.keys.jump = true;
                break;
            case 'Shift':
                this.keys.sprint = true;
                break;
        }
    }
    
    handleKeyUp(event) {
        switch (event.key) {
            case 'ArrowUp':
            case 'w':
                this.keys.forward = false;
                break;
            case 'ArrowDown':
            case 's':
                this.keys.backward = false;
                break;
            case 'ArrowLeft':
            case 'a':
                this.keys.left = false;
                break;
            case 'ArrowRight':
            case 'd':
                this.keys.right = false;
                break;
            case ' ':
                this.keys.jump = false;
                break;
            case 'Shift':
                this.keys.sprint = false;
                break;
        }
    }
    
    resetKeys() {
        // Reset all keys to false
        for (const key in this.keys) {
            this.keys[key] = false;
        }
    }
    
    getInput() {
        // Return a copy of the current input state
        return { ...this.keys };
    }
} 