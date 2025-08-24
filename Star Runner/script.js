// Star Runner Game - Main Script

// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
const gameState = {
    current: 'menu', // menu, playing, paused, gameOver, levelComplete
    score: 0,
    level: 1,
    lives: 3
};

// Game Objects
let player;
let bullets = [];
let enemies = [];
let powerUps = [];
let particles = [];
let stars = [];

// Input Handling
const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    space: false
};

// Game Entities
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.speed = 5;
        this.health = 100;
        this.maxHealth = 100;
        this.fireRate = 250; // milliseconds
        this.lastShot = 0;
        this.powerUps = {
            rapidFire: 0,
            multiShot: 0,
            shield: 0
        };
    }

    update(deltaTime) {
        // Movement
        if (keys.left && this.x > 0) this.x -= this.speed;
        if (keys.right && this.x < canvas.width - this.width) this.x += this.speed;
        if (keys.up && this.y > 0) this.y -= this.speed;
        if (keys.down && this.y < canvas.height - this.height) this.y += this.speed;

        // Shooting
        if (keys.space && Date.now() - this.lastShot > this.getFireRate()) {
            this.shoot();
            this.lastShot = Date.now();
        }

        // Update power-ups
        Object.keys(this.powerUps).forEach(key => {
            if (this.powerUps[key] > 0) {
                this.powerUps[key] -= deltaTime / 1000;
            }
        });
    }

    shoot() {
        if (this.powerUps.multiShot > 0) {
            // Multi-shot
            bullets.push(new Bullet(this.x + this.width/2 - 2, this.y, -8));
            bullets.push(new Bullet(this.x + this.width/2 - 8, this.y, -8));
            bullets.push(new Bullet(this.x + this.width/2 + 4, this.y, -8));
        } else {
            bullets.push(new Bullet(this.x + this.width/2 - 2, this.y, -8));
        }
    }

    getFireRate() {
        return this.powerUps.rapidFire > 0 ? this.fireRate / 3 : this.fireRate;
    }

    takeDamage(damage) {
        if (this.powerUps.shield > 0) return;
        
        this.health -= damage;
        if (this.health <= 0) {
            this.health = 0;
            gameState.lives--;
            if (gameState.lives > 0) {
                this.health = this.maxHealth;
                // Add invincibility briefly
                this.powerUps.shield = 2;
            }
        }
    }

    draw() {
        // Player ship (triangle)
        ctx.fillStyle = this.powerUps.shield > 0 ? '#00ff00' : '#00aaff';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        // Health bar
        const barWidth = 50;
        const barHeight = 6;
        const barX = this.x + this.width/2 - barWidth/2;
        const barY = this.y + this.height + 5;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        ctx.fillStyle = '#ff3333';
        const healthPercent = this.health / this.maxHealth;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }
}

class Bullet {
    constructor(x, y, speed, isEnemy = false) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 10;
        this.speed = speed;
        this.isEnemy = isEnemy;
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        ctx.fillStyle = this.isEnemy ? '#ff3333' : '#ffff00';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    isOffScreen() {
        return this.y < -this.height || this.y > canvas.height;
    }
}

class Enemy {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 30;
        this.height = 30;
        this.health = this.getHealthByType();
        this.maxHealth = this.health;
        this.speed = this.getSpeedByType();
        this.shootTimer = 0;
        this.shootInterval = 1000 + Math.random() * 2000;
        this.points = this.getPointsByType();
    }

    getHealthByType() {
        const healthMap = {
            basic: 20,
            fast: 15,
            heavy: 50,
            boss: 200,
            alien: 25,
            elite: 40
        };
        return healthMap[this.type] || 20;
    }

    getSpeedByType() {
        const speedMap = {
            basic: 1.5,
            fast: 3,
            heavy: 0.8,
            boss: 1,
            alien: 2,
            elite: 1.2
        };
        return speedMap[this.type] || 1.5;
    }

    getPointsByType() {
        const pointsMap = {
            basic: 10,
            fast: 15,
            heavy: 25,
            boss: 100,
            alien: 20,
            elite: 35
        };
        return pointsMap[this.type] || 10;
    }

    update(deltaTime) {
        this.y += this.speed;
        
        // Enemy shooting
        this.shootTimer += deltaTime;
        if (this.shootTimer > this.shootInterval) {
            if (Math.random() < 0.3) { // 30% chance to shoot
                bullets.push(new Bullet(this.x + this.width/2 - 2, this.y + this.height, 4, true));
            }
            this.shootTimer = 0;
        }
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            gameState.score += this.points;
            
            // Chance to drop power-up
            if (Math.random() < 0.15) {
                const powerUpTypes = ['health', 'rapidFire', 'multiShot', 'shield'];
                const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
                powerUps.push(new PowerUp(this.x + this.width/2, this.y + this.height/2, randomType));
            }
            
            // Create explosion particles
            for (let i = 0; i < 8; i++) {
                particles.push(new Particle(this.x + this.width/2, this.y + this.height/2));
            }
            
            return true; // Enemy destroyed
        }
        return false;
    }

    draw() {
        // Enemy ship color based on type
        const colorMap = {
            basic: '#ff4444',
            fast: '#ff8844',
            heavy: '#8844ff',
            boss: '#ff44ff',
            alien: '#44ff88',
            elite: '#ffff44'
        };
        
        ctx.fillStyle = colorMap[this.type] || '#ff4444';
        
        // Draw enemy (different shapes based on type)
        if (this.type === 'boss') {
            // Boss - larger rectangle
            ctx.fillRect(this.x, this.y, this.width * 2, this.height);
        } else if (this.type === 'heavy') {
            // Heavy - square
            ctx.fillRect(this.x, this.y, this.width, this.width);
        } else {
            // Basic triangle (inverted)
            ctx.beginPath();
            ctx.moveTo(this.x + this.width/2, this.y + this.height);
            ctx.lineTo(this.x, this.y);
            ctx.lineTo(this.x + this.width, this.y);
            ctx.closePath();
            ctx.fill();
        }

        // Health bar for stronger enemies
        if (this.maxHealth > 20) {
            const barWidth = this.width;
            const barHeight = 4;
            const barX = this.x;
            const barY = this.y - 8;
            
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = '#ff3333';
            const healthPercent = this.health / this.maxHealth;
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        }
    }

    isOffScreen() {
        return this.y > canvas.height;
    }
}

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 20;
        this.height = 20;
        this.speed = 2;
        this.duration = 5000; // 5 seconds
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        const colorMap = {
            health: '#00ff00',
            rapidFire: '#ffaa00',
            multiShot: '#0088ff',
            shield: '#aa00ff'
        };
        
        ctx.fillStyle = colorMap[this.type] || '#ffffff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add symbol
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        const symbol = {
            health: '+',
            rapidFire: 'R',
            multiShot: 'M',
            shield: 'S'
        };
        ctx.fillText(symbol[this.type] || '?', this.x + this.width/2, this.y + this.height/2 + 4);
    }

    isOffScreen() {
        return this.y > canvas.height;
    }

    applyTo(player) {
        switch(this.type) {
            case 'health':
                player.health = Math.min(player.maxHealth, player.health + 30);
                break;
            case 'rapidFire':
                player.powerUps.rapidFire = Math.max(player.powerUps.rapidFire, 8);
                break;
            case 'multiShot':
                player.powerUps.multiShot = Math.max(player.powerUps.multiShot, 10);
                break;
            case 'shield':
                player.powerUps.shield = Math.max(player.powerUps.shield, 6);
                break;
        }
    }
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 1.0;
        this.decay = 0.02;
        this.size = Math.random() * 4 + 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life -= this.decay;
    }

    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = `hsl(${60 - this.life * 60}, 100%, 50%)`;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }

    isDead() {
        return this.life <= 0;
    }
}

class Star {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.speed = Math.random() * 2 + 0.5;
        this.size = Math.random() * 2 + 1;
        this.brightness = Math.random();
    }

    update() {
        this.y += this.speed;
        if (this.y > canvas.height) {
            this.y = -this.size;
            this.x = Math.random() * canvas.width;
        }
    }

    draw() {
        ctx.globalAlpha = this.brightness;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

// Game Initialization
function initGame() {
    player = new Player(canvas.width / 2 - 20, canvas.height - 80);
    
    // Create star field
    for (let i = 0; i < 50; i++) {
        stars.push(new Star());
    }
    
    // Reset game state
    gameState.score = 0;
    gameState.level = 1;
    gameState.lives = 3;
    
    bullets = [];
    enemies = [];
    powerUps = [];
    particles = [];
}

// Enemy Spawning
let enemySpawnTimer = 0;
const enemySpawnInterval = 2000; // 2 seconds

function spawnEnemy() {
    const x = Math.random() * (canvas.width - 30);
    const types = ['basic', 'basic', 'fast', 'heavy']; // Weighted random
    const type = types[Math.floor(Math.random() * types.length)];
    enemies.push(new Enemy(x, -30, type));
}

// Collision Detection
function checkCollisions() {
    // Player bullets vs enemies
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        if (bullet.isEnemy) continue;
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                
                // Hit enemy
                bullets.splice(i, 1);
                if (enemy.takeDamage(10)) {
                    enemies.splice(j, 1);
                }
                break;
            }
        }
    }
    
    // Enemy bullets vs player
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        if (!bullet.isEnemy) continue;
        
        if (bullet.x < player.x + player.width &&
            bullet.x + bullet.width > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y) {
            
            // Hit player
            bullets.splice(i, 1);
            player.takeDamage(15);
        }
    }
    
    // Player vs enemies (collision)
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (enemy.x < player.x + player.width &&
            enemy.x + enemy.width > player.x &&
            enemy.y < player.y + player.height &&
            enemy.y + enemy.height > player.y) {
            
            // Collision
            enemies.splice(i, 1);
            player.takeDamage(25);
            
            // Create explosion
            for (let j = 0; j < 6; j++) {
                particles.push(new Particle(enemy.x + enemy.width/2, enemy.y + enemy.height/2));
            }
        }
    }
    
    // Player vs power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        if (powerUp.x < player.x + player.width &&
            powerUp.x + powerUp.width > player.x &&
            powerUp.y < player.y + player.height &&
            powerUp.y + powerUp.height > player.y) {
            
            // Collected power-up
            powerUp.applyTo(player);
            powerUps.splice(i, 1);
        }
    }
}

// Game Update
function update(deltaTime) {
    if (gameState.current !== 'playing') return;
    
    // Update player
    player.update(deltaTime);
    
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        if (bullets[i].isOffScreen()) {
            bullets.splice(i, 1);
        }
    }
    
    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].update(deltaTime);
        if (enemies[i].isOffScreen()) {
            enemies.splice(i, 1);
        }
    }
    
    // Update power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].update();
        if (powerUps[i].isOffScreen()) {
            powerUps.splice(i, 1);
        }
    }
    
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].isDead()) {
            particles.splice(i, 1);
        }
    }
    
    // Update stars
    stars.forEach(star => star.update());
    
    // Spawn enemies
    enemySpawnTimer += deltaTime;
    if (enemySpawnTimer > enemySpawnInterval) {
        spawnEnemy();
        enemySpawnTimer = 0;
    }
    
    // Check collisions
    checkCollisions();
    
    // Check game over
    if (gameState.lives <= 0) {
        gameState.current = 'gameOver';
    }
}

// Game Render
function render() {
    // Clear canvas
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars
    stars.forEach(star => star.draw());
    
    if (gameState.current === 'playing') {
        // Draw game objects
        player.draw();
        bullets.forEach(bullet => bullet.draw());
        enemies.forEach(enemy => enemy.draw());
        powerUps.forEach(powerUp => powerUp.draw());
        particles.forEach(particle => particle.draw());
        
        // Draw UI
        drawUI();
    } else if (gameState.current === 'menu') {
        drawMenu();
    } else if (gameState.current === 'gameOver') {
        drawGameOver();
    }
}

function drawUI() {
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${gameState.score}`, 10, 30);
    ctx.fillText(`Lives: ${gameState.lives}`, 10, 60);
    ctx.fillText(`Level: ${gameState.level}`, 10, 90);
    
    // Power-up indicators
    let yOffset = 120;
    Object.keys(player.powerUps).forEach(key => {
        if (player.powerUps[key] > 0) {
            ctx.fillStyle = '#00ff00';
            ctx.fillText(`${key.toUpperCase()}: ${Math.ceil(player.powerUps[key])}s`, 10, yOffset);
            yOffset += 25;
        }
    });
}

function drawMenu() {
    ctx.fillStyle = '#ffffff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('STAR RUNNER', canvas.width/2, canvas.height/2 - 100);
    
    ctx.font = '24px Arial';
    ctx.fillText('Press SPACE to Start', canvas.width/2, canvas.height/2 - 40);
    ctx.fillText('Use ARROW KEYS to move', canvas.width/2, canvas.height/2);
    ctx.fillText('Hold SPACE to shoot', canvas.width/2, canvas.height/2 + 40);
}

function drawGameOver() {
    ctx.fillStyle = '#ff3333';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 60);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${gameState.score}`, canvas.width/2, canvas.height/2 - 10);
    ctx.fillText('Press SPACE to Restart', canvas.width/2, canvas.height/2 + 40);
}

// Input Event Listeners
document.addEventListener('keydown', (e) => {
    switch(e.code) {
        case 'ArrowLeft':
            keys.left = true;
            break;
        case 'ArrowRight':
            keys.right = true;
            break;
        case 'ArrowUp':
            keys.up = true;
            break;
        case 'ArrowDown':
            keys.down = true;
            break;
        case 'Space':
            e.preventDefault();
            keys.space = true;
            
            // Menu/Game Over state handling
            if (gameState.current === 'menu' || gameState.current === 'gameOver') {
                initGame();
                gameState.current = 'playing';
            }
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.code) {
        case 'ArrowLeft':
            keys.left = false;
            break;
        case 'ArrowRight':
            keys.right = false;
            break;
        case 'ArrowUp':
            keys.up = false;
            break;
        case 'ArrowDown':
            keys.down = false;
            break;
        case 'Space':
            keys.space = false;
            break;
    }
});

// Game Loop
let lastTime = 0;

function gameLoop(currentTime) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    update(deltaTime);
    render();
    
    requestAnimationFrame(gameLoop);
}

// Initialize and start the game
initGame();
gameState.current = 'menu';
requestAnimationFrame(gameLoop);