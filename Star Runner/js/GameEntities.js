import { eventBus } from './EventBus.js';

// Base Game Entity
export class GameEntity {
    constructor(x, y, width, height, color = '#fff') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.velocity = { x: 0, y: 0 };
        this.health = 1;
        this.active = true;
    }

    update(deltaTime) {
        this.x += this.velocity.x * deltaTime;
        this.y += this.velocity.y * deltaTime;
    }

    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    checkCollision(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }

    takeDamage(amount = 1) {
        this.health -= amount;
        if (this.health <= 0) {
            this.active = false;
        }
    }
}

// Player Class
export class Player extends GameEntity {
    constructor(x, y) {
        super(x, y, 30, 40, '#00ff88');
        this.health = 3;
        this.maxHealth = 3;
        this.speed = 300;
        this.fireRate = 0.2;
        this.lastShot = 0;
        this.powerUps = new Map();
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
    }

    update(deltaTime, keys) {
        // Movement
        this.velocity.x = 0;
        this.velocity.y = 0;

        if (keys['ArrowLeft']) this.velocity.x = -this.speed;
        if (keys['ArrowRight']) this.velocity.x = this.speed;
        if (keys['ArrowUp']) this.velocity.y = -this.speed;
        if (keys['ArrowDown']) this.velocity.y = this.speed;

        super.update(deltaTime);

        // Boundary checking
        this.x = Math.max(0, Math.min(770, this.x));
        this.y = Math.max(0, Math.min(560, this.y));

        // Update timers
        this.lastShot += deltaTime;

        // Invulnerability
        if (this.invulnerable) {
            this.invulnerabilityTime -= deltaTime;
            if (this.invulnerabilityTime <= 0) {
                this.invulnerable = false;
            }
        }

        // Update power-ups (using closure for timing)
        for (let [type, powerUp] of this.powerUps) {
            powerUp.duration -= deltaTime;
            if (powerUp.duration <= 0) {
                this.removePowerUp(type);
            }
        }
    }

    render(ctx) {
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2) {
            return; // Flashing effect
        }

        ctx.fillStyle = this.color;
        // Draw ship shape
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width/2, this.y + this.height - 10);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        // Engine glow
        ctx.fillStyle = '#ff6b35';
        ctx.fillRect(this.x + 8, this.y + this.height - 5, 4, 8);
        ctx.fillRect(this.x + this.width - 12, this.y + this.height - 5, 4, 8);
    }

    shoot() {
        const currentFireRate = this.powerUps.has('rapidFire') ? 0.1 : this.fireRate;
        if (this.lastShot >= currentFireRate) {
            const projectiles = [];
            
            if (this.powerUps.has('multiShot')) {
                // Triple shot
                projectiles.push(new Projectile(
                    this.x + this.width/2 - 2, this.y, 0, -500, 'player'
                ));
                projectiles.push(new Projectile(
                    this.x + this.width/2 - 2, this.y, -0.3, -500, 'player'
                ));
                projectiles.push(new Projectile(
                    this.x + this.width/2 - 2, this.y, 0.3, -500, 'player'
                ));
            } else {
                projectiles.push(new Projectile(
                    this.x + this.width/2 - 2, this.y, 0, -500, 'player'
                ));
            }
            
            this.lastShot = 0;
            return projectiles;
        }
        return [];
    }

    addPowerUp(type) {
        const duration = 10; // 10 seconds
        // Using closure to create timed power-up logic
        const powerUpClosure = (remainingTime) => {
            return {
                duration: remainingTime,
                tick: (dt) => {
                    remainingTime -= dt;
                    return remainingTime > 0;
                }
            };
        };
        
        this.powerUps.set(type, powerUpClosure(duration));
        eventBus.emit('powerUpActivated', { type, duration });
    }

    removePowerUp(type) {
        this.powerUps.delete(type);
        eventBus.emit('powerUpExpired', type);
    }

    takeDamage(amount = 1) {
        if (this.invulnerable) return;
        
        super.takeDamage(amount);
        this.invulnerable = true;
        this.invulnerabilityTime = 2.0; // 2 seconds of invulnerability
        eventBus.emit('playerHit', this.health);
    }
}

// Enemy Classes
export class BasicEnemy extends GameEntity {
    constructor(x, y) {
        super(x, y, 25, 25, '#ff4444');
        this.speed = 100;
        this.velocity.y = this.speed;
        this.points = 100;
    }

    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add some detail
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + 8, this.y + 8, 9, 9);
    }
}

export class FastEnemy extends GameEntity {
    constructor(x, y) {
        super(x, y, 20, 20, '#ffaa00');
        this.speed = 200;
        this.velocity.y = this.speed;
        this.points = 200;
    }

    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
        ctx.fill();
    }
}

export class BossEnemy extends GameEntity {
    constructor(x, y) {
        super(x, y, 60, 60, '#aa00ff');
        this.health = 10;
        this.speed = 50;
        this.velocity.y = this.speed;
        this.points = 1000;
        this.direction = 1;
        this.lastShot = 0;
        this.fireRate = 1.0;
    }

    update(deltaTime) {
        // Boss movement pattern
        this.velocity.x = this.direction * this.speed;
        if (this.x <= 0 || this.x >= 740) {
            this.direction *= -1;
        }

        super.update(deltaTime);
        this.lastShot += deltaTime;
    }

    shoot() {
        if (this.lastShot >= this.fireRate) {
            this.lastShot = 0;
            return [new Projectile(
                this.x + this.width/2 - 2, this.y + this.height, 0, 300, 'enemy'
            )];
        }
        return [];
    }

    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Boss details
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + 10, this.y + 10, 10, 10);
        ctx.fillRect(this.x + 40, this.y + 10, 10, 10);
        ctx.fillRect(this.x + 25, this.y + 35, 10, 10);
        
        // Health bar
        const healthPercent = this.health / 10;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, this.y - 10, this.width, 5);
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(this.x, this.y - 10, this.width * healthPercent, 5);
    }
}

// Power-up Class
export class PowerUp extends GameEntity {
    constructor(type, x, y) {
        super(x, y, 20, 20, '#ff6b35');
        this.type = type;
        this.velocity.y = 100;
        this.bobOffset = 0;
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.bobOffset += deltaTime * 5;
    }

    render(ctx) {
        const bobY = this.y + Math.sin(this.bobOffset) * 3;
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, bobY + this.height/2, this.width/2, 0, Math.PI * 2);
        ctx.fill();

        // Power-up icon
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        let icon = '';
        switch(this.type) {
            case 'rapidFire': icon = 'R'; break;
            case 'multiShot': icon = 'M'; break;
            case 'health': icon = '+'; break;
        }
        ctx.fillText(icon, this.x + this.width/2, bobY + this.height/2 + 4);
    }
}

// Projectile Class
export class Projectile extends GameEntity {
    constructor(x, y, direction, speed, owner) {
        super(x, y, 4, 10, owner === 'player' ? '#00ffff' : '#ff0000');
        this.velocity.x = direction * Math.abs(speed);
        this.velocity.y = speed;
        this.owner = owner;
    }

    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add glow effect for player projectiles
        if (this.owner === 'player') {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 5;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.shadowBlur = 0;
        }
    }
}