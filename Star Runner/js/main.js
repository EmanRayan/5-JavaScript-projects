// Main Game Module - Star Runner
import { EventBus, eventBus } from './EventBus.js';
import { GameEntityFactory } from './GameEntityFactory.js';
import { Player, BasicEnemy, FastEnemy, BossEnemy, PowerUp, Projectile } from './GameEntities.js';
import { LevelManager } from './LevelManager.js';
import { StorageManager } from './StorageManager.js';

// Main Game Class
class StarRunnerGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'menu'; // menu, playing, paused, gameOver, loading
        
        this.keys = {};
        this.score = 0;
        this.lives = 3;
        this.lastTime = 0;
        this.gameTime = 0;
        
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.powerUps = [];
        
        this.levelManager = new LevelManager();
        this.statistics = StorageManager.getStatistics();
        
        this.setupEventListeners();
        this.setupUI();
        
        // Show loading screen
        this.showLoadingScreen();
        
        // Initialize game
        this.init();
    }

    async init() {
        try {
            // Simulate initialization delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Preload first few levels
            await this.levelManager.preloadLevels([1, 2, 3]);
            
            this.hideLoadingScreen();
            this.updateHighScoreDisplay();
            
        } catch (error) {
            this.showError('Failed to initialize game: ' + error.message);
        }
    }

    showLoadingScreen() {
        document.getElementById('loadingScreen').classList.remove('hidden');
    }

    hideLoadingScreen() {
        document.getElementById('loadingScreen').classList.add('hidden');
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Space' && this.gameState === 'playing') {
                e.preventDefault();
                this.handleShooting();
            }
            
            if (e.code === 'KeyP' && this.gameState === 'playing') {
                this.pauseGame();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // UI button events
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.resumeGame();
        });

        document.getElementById('mainMenuBtn').addEventListener('click', () => {
            this.goToMainMenu();
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('menuBtn').addEventListener('click', () => {
            this.goToMainMenu();
        });

        // Event bus subscriptions
        eventBus.subscribe('playerHit', (health) => {
            this.lives = health;
            this.updateUI();
            if (this.lives <= 0) {
                this.gameOver();
            }
        });

        eventBus.subscribe('powerUpActivated', (data) => {
            this.updatePowerUpDisplay();
        });

        eventBus.subscribe('powerUpExpired', (type) => {
            this.updatePowerUpDisplay();
        });
    }

    setupUI() {
        this.updateUI();
    }

    async startGame() {
        this.showLoadingScreen();
        
        try {
            const selectedLevel = parseInt(document.getElementById('levelSelect').value);
            const levelLoaded = await this.levelManager.loadLevel(selectedLevel);
            
            if (!levelLoaded) {
                throw new Error('Failed to load level');
            }

            this.gameState = 'playing';
            this.score = 0;
            this.lives = 3;
            this.gameTime = 0;
            
            // Initialize game objects
            this.player = GameEntityFactory.createPlayer(385, 500);
            this.enemies = [];
            this.projectiles = [];
            this.powerUps = [];
            
            this.hideAllOverlays();
            this.hideLoadingScreen();
            this.updateUI();
            
            // Update statistics
            this.statistics.gamesPlayed++;
            StorageManager.saveStatistics(this.statistics);
            
            // Start game loop
            this.lastTime = performance.now();
            this.gameLoop();
            
        } catch (error) {
            this.showError('Failed to start game: ' + error.message);
            setTimeout(() => {
                this.hideLoadingScreen();
                this.goToMainMenu();
            }, 2000);
        }
    }

    gameLoop(currentTime = 0) {
        if (this.gameState !== 'playing') return;

        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.016);
        this.lastTime = currentTime;
        this.gameTime += deltaTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        // Update player
        this.player.update(deltaTime, this.keys);

        // Update enemies
        this.enemies.forEach(enemy => {
            enemy.update(deltaTime);
            
            // Boss enemies can shoot
            if (enemy instanceof BossEnemy) {
                const newProjectiles = enemy.shoot();
                this.projectiles.push(...newProjectiles);
            }
        });

        // Update projectiles
        this.projectiles.forEach(projectile => {
            projectile.update(deltaTime);
        });

        // Update power-ups
        this.powerUps.forEach(powerUp => {
            powerUp.update(deltaTime);
        });

        // Spawn new enemies from level manager
        const newEnemies = this.levelManager.update(deltaTime, this.enemies);
        this.enemies.push(...newEnemies);

        // Collision detection
        this.checkCollisions();

        // Remove inactive entities
        this.cleanupEntities();

        // Random power-up spawn with closure for timing
        this.managePowerUpSpawning(deltaTime);

        // Check level completion
        if (this.levelManager.isLevelComplete() && this.enemies.length === 0) {
            this.levelComplete();
        }
    }

    // Power-up spawning with closure for timed logic
    managePowerUpSpawning(deltaTime) {
        // Create a closure for power-up spawn timing
        if (!this.powerUpSpawnClosure) {
            let spawnTimer = 0;
            const spawnInterval = 15; // 15 seconds base interval
            
            this.powerUpSpawnClosure = (dt) => {
                spawnTimer += dt;
                const currentChance = this.levelManager.getCurrentPowerUpChance();
                
                if (spawnTimer >= spawnInterval && Math.random() < currentChance) {
                    this.spawnRandomPowerUp();
                    spawnTimer = 0;
                    return true;
                }
                return false;
            };
        }
        
        this.powerUpSpawnClosure(deltaTime);
    }

    checkCollisions() {
        // Player projectiles vs enemies
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            if (projectile.owner !== 'player') continue;

            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (projectile.checkCollision(enemy)) {
                    projectile.active = false;
                    enemy.takeDamage();
                    
                    if (!enemy.active) {
                        this.score += enemy.points;
                        this.statistics.enemiesDefeated++;
                        this.updateUI();
                    }
                    break;
                }
            }
        }

        // Enemy projectiles vs player
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            if (projectile.owner !== 'enemy') continue;

            if (projectile.checkCollision(this.player)) {
                projectile.active = false;
                this.player.takeDamage();
            }
        }

        // Player vs enemies
        this.enemies.forEach(enemy => {
            if (enemy.checkCollision(this.player)) {
                enemy.active = false;
                this.player.takeDamage();
            }
        });

        // Player vs power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (powerUp.checkCollision(this.player)) {
                this.collectPowerUp(powerUp);
                powerUp.active = false;
            }
        }
    }

    collectPowerUp(powerUp) {
        this.statistics.powerUpsCollected++;
        
        switch(powerUp.type) {
            case 'health':
                if (this.player.health < this.player.maxHealth) {
                    this.player.health++;
                    this.lives = this.player.health;
                    this.updateUI();
                }
                break;
            case 'rapidFire':
            case 'multiShot':
                this.player.addPowerUp(powerUp.type);
                break;
        }
    }

    cleanupEntities() {
        // Remove inactive or off-screen entities
        this.enemies = this.enemies.filter(enemy => 
            enemy.active && enemy.y < this.canvas.height + 50
        );
        
        this.projectiles = this.projectiles.filter(projectile => 
            projectile.active && 
            projectile.y > -50 && 
            projectile.y < this.canvas.height + 50 &&
            projectile.x > -50 && 
            projectile.x < this.canvas.width + 50
        );
        
        this.powerUps = this.powerUps.filter(powerUp => 
            powerUp.active && powerUp.y < this.canvas.height + 50
        );
    }

    spawnRandomPowerUp() {
        const availablePowerUps = this.levelManager.getAvailablePowerUps();
        if (availablePowerUps.length === 0) return;
        
        const randomType = availablePowerUps[Math.floor(Math.random() * availablePowerUps.length)];
        const x = Math.random() * (this.canvas.width - 20);
        const powerUp = GameEntityFactory.createPowerUp(randomType, x, -20);
        this.powerUps.push(powerUp);
    }

    handleShooting() {
        const projectiles = this.player.shoot();
        this.projectiles.push(...projectiles);
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw stars background
        this.drawStarfield();

        // Render all entities
        this.enemies.forEach(enemy => enemy.render(this.ctx));
        this.projectiles.forEach(projectile => projectile.render(this.ctx));
        this.powerUps.forEach(powerUp => powerUp.render(this.ctx));
        this.player.render(this.ctx);

        // Draw UI elements on canvas
        this.drawHUD();
    }

    drawStarfield() {
        // Simple starfield effect
        this.ctx.fillStyle = 'white';
        for (let i = 0; i < 50; i++) {
            const x = (i * 47) % this.canvas.width;
            const y = (i * 71 + this.gameTime * 20) % this.canvas.height;
            const size = (i % 3) + 1;
            this.ctx.fillRect(x, y, size, size);
        }
    }

    drawHUD() {
        this.ctx.fillStyle = '#00ff88';
        this.ctx.font = '16px Courier New';
        
        // Draw level info
        const levelInfo = this.levelManager.getCurrentLevelInfo();
        if (levelInfo) {
            this.ctx.fillText(`${levelInfo.name} - Wave ${levelInfo.currentWave}/${levelInfo.totalWaves}`, 10, this.canvas.height - 20);
        }
    }

    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pauseMenu').classList.remove('hidden');
        }
    }

    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            document.getElementById('pauseMenu').classList.add('hidden');
            this.lastTime = performance.now();
            this.gameLoop();
        }
    }

    levelComplete() {
        this.statistics.levelsCompleted++;
        StorageManager.saveStatistics(this.statistics);
        
        // Could show level complete screen here
        console.log('Level Complete!');
        
        // For now, just go to game over
        this.gameOver(true);
    }

    gameOver(victory = false) {
        this.gameState = 'gameOver';
        
        // Update statistics
        this.statistics.totalScore += this.score;
        this.statistics.timeSpentPlaying += this.gameTime;
        StorageManager.saveStatistics(this.statistics);
        
        // Check and save high score
        const isNewHighScore = StorageManager.saveHighScore(this.score);
        
        // Update UI
        document.getElementById('gameOverTitle').textContent = victory ? 'LEVEL COMPLETE!' : 'GAME OVER';
        document.getElementById('finalScore').textContent = `Final Score: ${this.score}`;
        document.getElementById('highScoreDisplay').textContent = `High Score: ${StorageManager.getHighScore()}`;
        
        if (isNewHighScore) {
            document.getElementById('gameOverTitle').textContent += ' 🏆 NEW HIGH SCORE!';
        }
        
        document.getElementById('gameOverMenu').classList.remove('hidden');
    }

    goToMainMenu() {
        this.gameState = 'menu';
        this.hideAllOverlays();
        document.getElementById('mainMenu').classList.remove('hidden');
        this.updateHighScoreDisplay();
    }

    hideAllOverlays() {
        const overlays = document.querySelectorAll('.overlay');
        overlays.forEach(overlay => overlay.classList.add('hidden'));
    }

    updateUI() {
        document.getElementById('scoreValue').textContent = this.score;
        document.getElementById('livesValue').textContent = this.lives;
        document.getElementById('levelValue').textContent = this.levelManager.currentLevel;
        document.getElementById('highScoreValue').textContent = StorageManager.getHighScore();
    }

    updateHighScoreDisplay() {
        document.getElementById('highScoreValue').textContent = StorageManager.getHighScore();
    }

    updatePowerUpDisplay() {
        const powerUpList = document.getElementById('powerUpList');
        const indicator = document.getElementById('powerUpIndicator');
        
        if (this.player && this.player.powerUps.size > 0) {
            let html = '';
            for (let [type, powerUp] of this.player.powerUps) {
                const timeLeft = Math.ceil(powerUp.duration);
                html += `<div class="power-up-item">${this.getPowerUpDisplayName(type)}: ${timeLeft}s</div>`;
            }
            powerUpList.innerHTML = html;
            indicator.classList.remove('hidden');
        } else {
            indicator.classList.add('hidden');
        }
    }

    getPowerUpDisplayName(type) {
        const names = {
            'rapidFire': '🔥 Rapid Fire',
            'multiShot': '⚡ Multi Shot',
            'health': '❤️ Health'
        };
        return names[type] || type;
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new StarRunnerGame();
    
    // Make game accessible globally for debugging
    window.starRunnerGame = game;
    
    console.log('Star Runner initialized successfully!');
    console.log('Game features:');
    console.log('- Event Bus (Observer Pattern) ✓');
    console.log('- Factory Pattern ✓');
    console.log('- ES6 Modules ✓');
    console.log('- Async/Await JSON Loading ✓');
    console.log('- localStorage Persistence ✓');
    console.log('- Closures for Power-ups ✓');
    console.log('- Error Handling ✓');
    console.log('- Canvas Rendering ✓');
    console.log('- DOM UI Management ✓');
    console.log('- Inheritance (GameEntity) ✓');
});