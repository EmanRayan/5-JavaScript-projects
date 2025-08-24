import { GameEntityFactory } from './GameEntityFactory.js';

// Level Manager with Async/Await JSON loading
export class LevelManager {
    constructor() {
        this.currentLevel = 1;
        this.levelData = null;
        this.spawnTimer = 0;
        this.waveIndex = 0;
        this.enemiesSpawned = 0;
        this.levelCache = new Map(); // Cache loaded levels
    }

    // Async method to load level data from JSON
    async loadLevel(levelNumber) {
        try {
            // Check cache first
            if (this.levelCache.has(levelNumber)) {
                this.levelData = this.levelCache.get(levelNumber);
                this.resetLevelState(levelNumber);
                return true;
            }

            // Simulate loading from external JSON file with error handling
            const levelData = await this.fetchLevelData(levelNumber);
            
            // Validate level data
            if (!this.validateLevelData(levelData)) {
                throw new Error(`Invalid level data for level ${levelNumber}`);
            }

            // Cache the loaded level
            this.levelCache.set(levelNumber, levelData);
            this.levelData = levelData;
            this.resetLevelState(levelNumber);
            
            return true;
        } catch (error) {
            console.error('Failed to load level:', error);
            throw error; // Re-throw to be handled by caller
        }
    }

    // Simulate fetching level data with Promise
    async fetchLevelData(levelNumber) {
        return new Promise((resolve, reject) => {
            // Simulate network delay
            setTimeout(() => {
                try {
                    const levelData = this.generateLevelData(levelNumber);
                    if (!levelData) {
                        reject(new Error(`Level ${levelNumber} not found`));
                        return;
                    }
                    resolve(levelData);
                } catch (error) {
                    reject(error);
                }
            }, Math.random() * 1000 + 500); // 500-1500ms delay
        });
    }

    // Generate level data (simulating JSON structure)
    generateLevelData(levelNumber) {
        const levels = {
            1: {
                id: 1,
                name: "Asteroid Field",
                description: "Navigate through dangerous asteroids",
                background: "space",
                music: "level1_theme.mp3",
                waves: [
                    { 
                        type: 'basic', 
                        count: 5, 
                        interval: 2.0,
                        formation: 'line',
                        powerUpChance: 0.08
                    },
                    { 
                        type: 'fast', 
                        count: 5, 
                        interval: 2.0,
                        formation: 'diamond',
                        powerUpChance: 0.12
                    },
                    { 
                        type: 'basic', 
                        count: 15, 
                        interval: 0.8,
                        formation: 'v-formation',
                        powerUpChance: 0.18
                    }
                ],
                powerUps: ['rapidFire', 'multiShot', 'health'],
                difficulty: 1.0
            },
            2: {
                id: 2,
                name: "Enemy Squadron",
                description: "Face organized enemy forces",
                background: "nebula",
                music: "level2_theme.mp3",
                waves: [
                    { 
                        type: 'basic', 
                        count: 10, 
                        interval: 1.0,
                        formation: 'line',
                        powerUpChance: 0.1
                    },
                    { 
                        type: 'basic', 
                        count: 8, 
                        interval: 1.5,
                        formation: 'diamond',
                        powerUpChance: 0.15
                    },
                    { 
                        type: 'fast', 
                        count: 6, 
                        interval: 2.5,
                        formation: 'v-formation',
                        powerUpChance: 0.2
                    },
                    { 
                        type: 'heavy', 
                        count: 3, 
                        interval: 4.0,
                        formation: 'line',
                        powerUpChance: 0.25
                    }
                ],
                powerUps: ['rapidFire', 'multiShot', 'shield'],
                difficulty: 1.5
            },
            3: {
                id: 3,
                name: "Boss Battle",
                description: "Ultimate challenge against the boss",
                background: "boss_arena",
                music: "boss_theme.mp3",
                waves: [
                    { 
                        type: 'basic', 
                        count: 5, 
                        interval: 1.5,
                        formation: 'line',
                        powerUpChance: 0.15
                    },
                    { 
                        type: 'fast', 
                        count: 8, 
                        interval: 1.2,
                        formation: 'diamond',
                        powerUpChance: 0.2
                    },
                    { 
                        type: 'heavy', 
                        count: 4, 
                        interval: 3.0,
                        formation: 'v-formation',
                        powerUpChance: 0.25
                    },
                    { 
                        type: 'boss', 
                        count: 1, 
                        interval: 5.0,
                        formation: 'single',
                        powerUpChance: 0.5
                    }
                ],
                powerUps: ['rapidFire', 'multiShot', 'health', 'shield', 'megaBlast'],
                difficulty: 2.5
            },
            4: {
                id: 4,
                name: "Alien Invasion",
                description: "Defend against alien mothership",
                background: "alien_world",
                music: "level4_theme.mp3",
                waves: [
                    { 
                        type: 'alien', 
                        count: 12, 
                        interval: 0.8,
                        formation: 'swarm',
                        powerUpChance: 0.1
                    },
                    { 
                        type: 'fast', 
                        count: 10, 
                        interval: 1.0,
                        formation: 'diamond',
                        powerUpChance: 0.15
                    },
                    { 
                        type: 'heavy', 
                        count: 6, 
                        interval: 2.5,
                        formation: 'line',
                        powerUpChance: 0.2
                    },
                    { 
                        type: 'alien', 
                        count: 15, 
                        interval: 0.6,
                        formation: 'chaos',
                        powerUpChance: 0.25
                    },
                    { 
                        type: 'mothership', 
                        count: 1, 
                        interval: 8.0,
                        formation: 'single',
                        powerUpChance: 0.8
                    }
                ],
                powerUps: ['rapidFire', 'multiShot', 'health', 'shield', 'megaBlast', 'timeFreeze'],
                difficulty: 3.0
            },
            5: {
                id: 5,
                name: "Final Showdown",
                description: "The ultimate test of survival",
                background: "final_battle",
                music: "final_boss_theme.mp3",
                waves: [
                    { 
                        type: 'mixed', 
                        count: 20, 
                        interval: 0.5,
                        formation: 'chaos',
                        powerUpChance: 0.12
                    },
                    { 
                        type: 'elite', 
                        count: 8, 
                        interval: 2.0,
                        formation: 'diamond',
                        powerUpChance: 0.18
                    },
                    { 
                        type: 'heavy', 
                        count: 10, 
                        interval: 1.8,
                        formation: 'v-formation',
                        powerUpChance: 0.22
                    },
                    { 
                        type: 'boss', 
                        count: 2, 
                        interval: 6.0,
                        formation: 'twin',
                        powerUpChance: 0.4
                    },
                    { 
                        type: 'finalBoss', 
                        count: 1, 
                        interval: 10.0,
                        formation: 'single',
                        powerUpChance: 1.0
                    }
                ],
                powerUps: ['rapidFire', 'multiShot', 'health', 'shield', 'megaBlast', 'timeFreeze', 'invincibility'],
                difficulty: 4.0
            }
        };

        return levels[levelNumber] || null;
    }

    // Validate level data structure
    validateLevelData(levelData) {
        if (!levelData || typeof levelData !== 'object') return false;
        if (!levelData.waves || !Array.isArray(levelData.waves)) return false;
        if (levelData.waves.length === 0) return false;
        
        // Validate each wave
        for (const wave of levelData.waves) {
            if (!wave.type || !wave.count || !wave.interval) return false;
            if (typeof wave.count !== 'number' || wave.count <= 0) return false;
            if (typeof wave.interval !== 'number' || wave.interval <= 0) return false;
        }
        
        return true;
    }

    // Reset level state
    resetLevelState(levelNumber) {
        this.currentLevel = levelNumber;
        this.spawnTimer = 0;
        this.waveIndex = 0;
        this.enemiesSpawned = 0;
    }

    // Update level progression
    update(deltaTime, enemies) {
        if (!this.levelData || this.waveIndex >= this.levelData.waves.length) {
            return [];
        }

        const currentWave = this.levelData.waves[this.waveIndex];
        const newEnemies = [];

        this.spawnTimer += deltaTime;

        // Spawn enemies based on current wave
        if (this.spawnTimer >= currentWave.interval && this.enemiesSpawned < currentWave.count) {
            const spawnedEnemies = this.spawnWaveEnemies(currentWave);
            newEnemies.push(...spawnedEnemies);
            this.enemiesSpawned += spawnedEnemies.length;
            this.spawnTimer = 0;
        }

        // Check if wave is complete and advance
        if (this.enemiesSpawned >= currentWave.count && enemies.length === 0) {
            this.advanceToNextWave();
        }

        return newEnemies;
    }

    // Spawn enemies for current wave
    spawnWaveEnemies(wave) {
        const enemies = [];
        
        if (wave.formation && wave.formation !== 'single') {
            // Create formation
            const centerX = Math.random() * 600 + 100;
            const formationEnemies = GameEntityFactory.createEnemyFormation(wave.formation, centerX, -50);
            enemies.push(...formationEnemies);
        } else {
            // Single enemy spawn
            const x = Math.random() * 750;
            const enemy = GameEntityFactory.createEnemy(wave.type, x, -50);
            enemies.push(enemy);
        }

        return enemies;
    }

    // Advance to next wave
    advanceToNextWave() {
        this.waveIndex++;
        this.enemiesSpawned = 0;
        this.spawnTimer = 0;
        
        console.log(`Advanced to wave ${this.waveIndex + 1} of ${this.levelData.waves.length}`);
    }

    // Check if current level is complete
    isLevelComplete() {
        return this.levelData && this.waveIndex >= this.levelData.waves.length;
    }

    // Get current level info
    getCurrentLevelInfo() {
        return this.levelData ? {
            id: this.levelData.id,
            name: this.levelData.name,
            description: this.levelData.description,
            currentWave: this.waveIndex + 1,
            totalWaves: this.levelData.waves.length,
            difficulty: this.levelData.difficulty
        } : null;
    }

    // Get power-up spawn chance for current wave
    getCurrentPowerUpChance() {
        if (!this.levelData || this.waveIndex >= this.levelData.waves.length) return 0;
        return this.levelData.waves[this.waveIndex].powerUpChance || 0.1;
    }

    // Get available power-ups for current level
    getAvailablePowerUps() {
        return this.levelData ? this.levelData.powerUps || [] : [];
    }

    // Clear level cache
    clearCache() {
        this.levelCache.clear();
    }

    // Pre-load multiple levels
    async preloadLevels(levelNumbers) {
        const promises = levelNumbers.map(async (levelNum) => {
            try {
                await this.loadLevel(levelNum);
                return { level: levelNum, success: true };
            } catch (error) {
                return { level: levelNum, success: false, error: error.message };
            }
        });

        const results = await Promise.allSettled(promises);
        return results.map((result, index) => ({
            level: levelNumbers[index],
            loaded: result.status === 'fulfilled' && result.value.success,
            error: result.status === 'rejected' ? result.reason : result.value.error
        }));
    }

    // Get next level number
    getNextLevel() {
        return this.currentLevel + 1;
    }

    // Check if there's a next level available
    hasNextLevel() {
        return this.generateLevelData(this.currentLevel + 1) !== null;
    }

    // Get level progress percentage
    getLevelProgress() {
        if (!this.levelData) return 0;
        const totalWaves = this.levelData.waves.length;
        const completedWaves = this.waveIndex;
        return Math.round((completedWaves / totalWaves) * 100);
    }

    // Get current wave progress
    getCurrentWaveProgress() {
        if (!this.levelData || this.waveIndex >= this.levelData.waves.length) return 100;
        const currentWave = this.levelData.waves[this.waveIndex];
        return Math.round((this.enemiesSpawned / currentWave.count) * 100);
    }

    // Get remaining enemies in current wave
    getRemainingEnemiesInWave() {
        if (!this.levelData || this.waveIndex >= this.levelData.waves.length) return 0;
        const currentWave = this.levelData.waves[this.waveIndex];
        return Math.max(0, currentWave.count - this.enemiesSpawned);
    }

    // Get total levels count
    getTotalLevelsCount() {
        let count = 0;
        let levelNum = 1;
        while (this.generateLevelData(levelNum) !== null) {
            count++;
            levelNum++;
        }
        return count;
    }
}