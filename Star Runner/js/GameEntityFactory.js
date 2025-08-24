import { Player, BasicEnemy, FastEnemy, BossEnemy, PowerUp, Projectile } from './GameEntities.js';

// Game Entity Factory Pattern
export class GameEntityFactory {
    static createPlayer(x, y) {
        return new Player(x, y);
    }

    static createEnemy(type, x, y) {
        switch(type) {
            case 'basic':
                return new BasicEnemy(x, y);
            case 'fast':
                return new FastEnemy(x, y);
            case 'boss':
                return new BossEnemy(x, y);
            default:
                return new BasicEnemy(x, y);
        }
    }

    static createPowerUp(type, x, y) {
        const validTypes = ['rapidFire', 'multiShot', 'health'];
        const powerUpType = validTypes.includes(type) ? type : this.getRandomPowerUpType();
        return new PowerUp(powerUpType, x, y);
    }

    static createProjectile(x, y, direction, speed, owner) {
        return new Projectile(x, y, direction, speed, owner);
    }

    // Helper method to get random power-up type
    static getRandomPowerUpType() {
        const types = ['rapidFire', 'multiShot', 'health'];
        return types[Math.floor(Math.random() * types.length)];
    }

    // Create multiple entities at once
    static createEnemyWave(enemyType, count, startX, startY, spacing = 50) {
        const enemies = [];
        for (let i = 0; i < count; i++) {
            const x = startX + (i * spacing);
            const y = startY;
            enemies.push(this.createEnemy(enemyType, x, y));
        }
        return enemies;
    }

    // Create formation of enemies
    static createEnemyFormation(pattern, centerX, centerY) {
        const enemies = [];
        
        switch(pattern) {
            case 'diamond':
                enemies.push(this.createEnemy('basic', centerX, centerY - 40));
                enemies.push(this.createEnemy('basic', centerX - 30, centerY));
                enemies.push(this.createEnemy('fast', centerX, centerY));
                enemies.push(this.createEnemy('basic', centerX + 30, centerY));
                enemies.push(this.createEnemy('basic', centerX, centerY + 40));
                break;
                
            case 'line':
                for (let i = 0; i < 5; i++) {
                    enemies.push(this.createEnemy('basic', centerX + (i - 2) * 40, centerY));
                }
                break;
                
            case 'v-formation':
                for (let i = 0; i < 5; i++) {
                    const offset = Math.abs(i - 2) * 30;
                    enemies.push(this.createEnemy('fast', centerX + (i - 2) * 40, centerY + offset));
                }
                break;
                
            default:
                enemies.push(this.createEnemy('basic', centerX, centerY));
        }
        
        return enemies;
    }
}