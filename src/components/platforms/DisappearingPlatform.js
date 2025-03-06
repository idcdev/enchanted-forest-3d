import * as THREE from 'three';
import { Platform } from './Platform.js';

export class DisappearingPlatform extends Platform {
    constructor(scene, x, y, z, width, height, depth, disappearTime, reappearTime) {
        super(scene, x, y, z, width, height, depth);
        
        // Timing properties
        this.disappearTime = disappearTime;
        this.reappearTime = reappearTime;
        this.timer = 0;
        this.state = 'visible'; // 'visible', 'disappearing', 'invisible', 'reappearing'
        
        // Override material color to distinguish from regular platforms
        this.mesh.material.color.set(0xcc6666);
        
        // Make material transparent for fade effects
        this.mesh.material.transparent = true;
        this.mesh.material.opacity = 1.0;
    }
    
    update(deltaTime) {
        // Update timer
        this.timer += deltaTime;
        
        // State machine for platform visibility
        switch (this.state) {
            case 'visible':
                // Platform is fully visible
                if (this.timer >= this.disappearTime) {
                    this.state = 'disappearing';
                    this.timer = 0;
                }
                break;
                
            case 'disappearing':
                // Platform is fading out
                const disappearProgress = this.timer / 0.5; // 0.5 seconds to fade out
                this.mesh.material.opacity = 1.0 - disappearProgress;
                
                if (disappearProgress >= 1.0) {
                    this.state = 'invisible';
                    this.timer = 0;
                    this.setVisible(false);
                }
                break;
                
            case 'invisible':
                // Platform is invisible
                if (this.timer >= this.reappearTime) {
                    this.state = 'reappearing';
                    this.timer = 0;
                    this.setVisible(true);
                }
                break;
                
            case 'reappearing':
                // Platform is fading in
                const reappearProgress = this.timer / 0.5; // 0.5 seconds to fade in
                this.mesh.material.opacity = reappearProgress;
                
                if (reappearProgress >= 1.0) {
                    this.state = 'visible';
                    this.timer = 0;
                    this.mesh.material.opacity = 1.0;
                }
                break;
        }
        
        // Update collider only if platform is visible
        if (this.isVisible()) {
            this.updateCollider();
        }
    }
    
    // Override setVisible to handle collider activation
    setVisible(visible) {
        super.setVisible(visible);
        this.isActive = visible;
    }
} 