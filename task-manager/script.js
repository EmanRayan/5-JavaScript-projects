// Main game entry point
import { GameEngine } from './modules/GameEngine.js';
import { UIManager } from './modules/UIManager.js';
import { StorageManager } from './modules/StorageManager.js';
import { AudioManager } from './modules/AudioManager.js';
import { EventBus } from './modules/EventBus.js';

// Global game state
let game = null;
let uiManager = null;
let storageManager = null;
let audioManager = null;
let eventBus = null;

// Initialize the game
function init() {
    try {
        // Create core systems
        eventBus = new EventBus();
        storageManager = new StorageManager();
        audioManager = new AudioManager();
        uiManager = new UIManager(eventBus, storageManager, audioManager);
        game = new GameEngine(eventBus, storageManager, audioManager);

        // Setup global event listeners
        setupGlobalEvents();

        // Load saved settings
        loadSettings();

        console.log('Star Runner initialized successfully');
    } catch (error) {
        console.error('Failed to initialize game:', error);
        showError('Failed to initialize game. Please refresh the page.');
    }
}

function setupGlobalEvents() {
    // UI Events
    eventBus.subscribe('ui.startGame', () => {
        game.start();
    });

    eventBus.subscribe('ui.pauseGame', () => {
        game.togglePause();
    });

    eventBus.subscribe('ui.resumeGame', () => {
        game.togglePause();
    });

    eventBus.subscribe('ui.restartGame', () => {
        game.restart();
    });

    eventBus.subscribe('ui.mainMenu', () => {
        game.stop();
        uiManager.showMenu('main');
    });

    eventBus.subscribe('ui.settingsChanged', (settings) => {
        applySettings(settings);
    });

    // Game Events
    eventBus.subscribe('game.started', () => {
        uiManager.showGameHUD();
    });

    eventBus.subscribe('game.paused', () => {
        uiManager.showMenu('pause');
    });

    eventBus.subscribe('game.resumed', () => {
        uiManager.hideAllMenus();
        uiManager.showGameHUD();
    });

    eventBus.subscribe('game.over', (data) => {
        uiManager.showGameOver(data.score, data.level);
    });

    eventBus.subscribe('game.scoreUpdated', (score) => {
        uiManager.updateScore(score);
    });

    eventBus.subscribe('game.levelChanged', (level) => {
        uiManager.updateLevel(level);
    });

    eventBus.subscribe('game.livesChanged', (lives) => {
        uiManager.updateLives(lives);
    });

    eventBus.subscribe('game.powerupActivated', (powerup) => {
        uiManager.showPowerupStatus(powerup);
    });

    eventBus.subscribe('game.powerupExpired', (powerupType) => {
        uiManager.hidePowerupStatus(powerupType);
    });

    // Error handling
    window.addEventListener('error', (event) => {
        console.error('Runtime error:', event.error);
        showError('An error occurred. The game may not work properly.');
    });

    // Prevent context menu on right-click
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // Handle visibility change (pause when tab is hidden)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && game && game.isRunning() && !game.isPaused()) {
            game.togglePause();
        }
    });
}

function loadSettings() {
    try {
        const settings = storageManager.load('settings', {
            sound: true,
            difficulty: 'normal'
        });

        applySettings(settings);
        uiManager.updateSettings(settings);
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

function applySettings(settings) {
    try {
        audioManager.setEnabled(settings.sound);
        if (game) {
            game.setDifficulty(settings.difficulty);
        }
        
        // Save settings
        storageManager.save('settings', settings);
    } catch (error) {
        console.error('Failed to apply settings:', error);
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '20px';
    errorDiv.style.left = '50%';
    errorDiv.style.transform = 'translateX(-50%)';
    errorDiv.style.background = 'rgba(255, 0, 0, 0.9)';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '15px 25px';
    errorDiv.style.borderRadius = '5px';
    errorDiv.style.zIndex = '9999';
    errorDiv.style.fontSize = '14px';
    errorDiv.textContent = message;

    document.body.appendChild(errorDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// Keyboard controls (global)
document.addEventListener('keydown', (event) => {
    if (!game) return;

    switch (event.code) {
        case 'Escape':
            if (game.isRunning()) {
                game.togglePause();
            }
            break;
        case 'KeyP':
            if (game.isRunning()) {
                game.togglePause();
            }
            break;
        case 'KeyR':
            if (game.isGameOver()) {
                eventBus.emit('ui.restartGame');
            }
            break;
        case 'KeyM':
            if (game.isGameOver() || game.isPaused()) {
                eventBus.emit('ui.mainMenu');
            }
            break;
    }
});

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for debugging
window.game = () => game;
window.eventBus = () => eventBus;