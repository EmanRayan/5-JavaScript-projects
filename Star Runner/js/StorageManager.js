// Storage Manager for localStorage persistence
export class StorageManager {
    static STORAGE_KEYS = {
        HIGH_SCORE: 'starrunner_highscore',
        SETTINGS: 'starrunner_settings',
        PLAYER_DATA: 'starrunner_playerdata',
        LEVEL_PROGRESS: 'starrunner_progress',
        STATISTICS: 'starrunner_stats'
    };

    // High Score Management
    static saveHighScore(score) {
        try {
            // In browser environment, use localStorage
            if (typeof(Storage) !== "undefined") {
                const currentHighScore = this.getHighScore();
                if (score > currentHighScore) {
                    localStorage.setItem(this.STORAGE_KEYS.HIGH_SCORE, score.toString());
                    return true; // New high score
                }
            } else {
                // Fallback for environments without localStorage
                if (!window.gameData) window.gameData = {};
                window.gameData.highScore = Math.max(window.gameData.highScore || 0, score);
                return score > (window.gameData.previousHigh || 0);
            }
        } catch (error) {
            console.warn('Failed to save high score:', error);
            // Fallback storage
            if (!window.gameData) window.gameData = {};
            window.gameData.highScore = Math.max(window.gameData.highScore || 0, score);
        }
        return false;
    }

    static getHighScore() {
        try {
            if (typeof(Storage) !== "undefined") {
                const score = localStorage.getItem(this.STORAGE_KEYS.HIGH_SCORE);
                return score ? parseInt(score) : 0;
            } else {
                if (!window.gameData) window.gameData = {};
                return window.gameData.highScore || 0;
            }
        } catch (error) {
            console.warn('Failed to get high score:', error);
            if (!window.gameData) window.gameData = {};
            return window.gameData.highScore || 0;
        }
    }

    // Settings Management
    static saveSettings(settings) {
        try {
            const settingsData = {
                soundEnabled: settings.soundEnabled ?? true,
                musicEnabled: settings.musicEnabled ?? true,
                difficulty: settings.difficulty || 'normal',
                controls: settings.controls || 'keyboard',
                graphics: settings.graphics || 'high',
                lastUpdated: Date.now()
            };

            if (typeof(Storage) !== "undefined") {
                localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settingsData));
            } else {
                if (!window.gameData) window.gameData = {};
                window.gameData.settings = settingsData;
            }
        } catch (error) {
            console.warn('Failed to save settings:', error);
        }
    }

    static getSettings() {
        try {
            let settingsData;
            
            if (typeof(Storage) !== "undefined") {
                const stored = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
                settingsData = stored ? JSON.parse(stored) : null;
            } else {
                if (!window.gameData) window.gameData = {};
                settingsData = window.gameData.settings;
            }

            // Return default settings if none found
            return settingsData || {
                soundEnabled: true,
                musicEnabled: true,
                difficulty: 'normal',
                controls: 'keyboard',
                graphics: 'high'
            };
        } catch (error) {
            console.warn('Failed to get settings:', error);
            return {
                soundEnabled: true,
                musicEnabled: true,
                difficulty: 'normal',
                controls: 'keyboard',
                graphics: 'high'
            };
        }
    }

    // Player Progress Management
    static savePlayerData(playerData) {
        try {
            const data = {
                level: playerData.level || 1,
                experience: playerData.experience || 0,
                unlockedLevels: playerData.unlockedLevels || [1],
                achievements: playerData.achievements || [],
                playTime: playerData.playTime || 0,
                lastPlayed: Date.now()
            };

            if (typeof(Storage) !== "undefined") {
                localStorage.setItem(this.STORAGE_KEYS.PLAYER_DATA, JSON.stringify(data));
            } else {
                if (!window.gameData) window.gameData = {};
                window.gameData.playerData = data;
            }
        } catch (error) {
            console.warn('Failed to save player data:', error);
        }
    }

    static getPlayerData() {
        try {
            let playerData;

            if (typeof(Storage) !== "undefined") {
                const stored = localStorage.getItem(this.STORAGE_KEYS.PLAYER_DATA);
                playerData = stored ? JSON.parse(stored) : null;
            } else {
                if (!window.gameData) window.gameData = {};
                playerData = window.gameData.playerData;
            }

            return playerData || {
                level: 1,
                experience: 0,
                unlockedLevels: [1],
                achievements: [],
                playTime: 0
            };
        } catch (error) {
            console.warn('Failed to get player data:', error);
            return {
                level: 1,
                experience: 0,
                unlockedLevels: [1],
                achievements: [],
                playTime: 0
            };
        }
    }

    // Statistics Management
    static saveStatistics(stats) {
        try {
            const statisticsData = {
                gamesPlayed: stats.gamesPlayed || 0,
                totalScore: stats.totalScore || 0,
                enemiesDefeated: stats.enemiesDefeated || 0,
                powerUpsCollected: stats.powerUpsCollected || 0,
                timeSpentPlaying: stats.timeSpentPlaying || 0,
                levelsCompleted: stats.levelsCompleted || 0,
                lastUpdated: Date.now()
            };

            if (typeof(Storage) !== "undefined") {
                localStorage.setItem(this.STORAGE_KEYS.STATISTICS, JSON.stringify(statisticsData));
            } else {
                if (!window.gameData) window.gameData = {};
                window.gameData.statistics = statisticsData;
            }
        } catch (error) {
            console.warn('Failed to save statistics:', error);
        }
    }

    static getStatistics() {
        try {
            let statistics;

            if (typeof(Storage) !== "undefined") {
                const stored = localStorage.getItem(this.STORAGE_KEYS.STATISTICS);
                statistics = stored ? JSON.parse(stored) : null;
            } else {
                if (!window.gameData) window.gameData = {};
                statistics = window.gameData.statistics;
            }

            return statistics || {
                gamesPlayed: 0,
                totalScore: 0,
                enemiesDefeated: 0,
                powerUpsCollected: 0,
                timeSpentPlaying: 0,
                levelsCompleted: 0
            };
        } catch (error) {
            console.warn('Failed to get statistics:', error);
            return {
                gamesPlayed: 0,
                totalScore: 0,
                enemiesDefeated: 0,
                powerUpsCollected: 0,
                timeSpentPlaying: 0,
                levelsCompleted: 0
            };
        }
    }

    // Utility Methods
    static clearAllData() {
        try {
            if (typeof(Storage) !== "undefined") {
                Object.values(this.STORAGE_KEYS).forEach(key => {
                    localStorage.removeItem(key);
                });
            } else {
                if (window.gameData) {
                    delete window.gameData;
                }
            }
            console.log('All game data cleared');
        } catch (error) {
            console.warn('Failed to clear all data:', error);
        }
    }

    static exportData() {
        try {
            const gameData = {
                highScore: this.getHighScore(),
                settings: this.getSettings(),
                playerData: this.getPlayerData(),
                statistics: this.getStatistics(),
                exportDate: new Date().toISOString()
            };
            return JSON.stringify(gameData, null, 2);
        } catch (error) {
            console.warn('Failed to export data:', error);
            return null;
        }
    }

    static importData(jsonString) {
        try {
            const gameData = JSON.parse(jsonString);
            
            if (gameData.highScore) {
                this.saveHighScore(gameData.highScore);
            }
            if (gameData.settings) {
                this.saveSettings(gameData.settings);
            }
            if (gameData.playerData) {
                this.savePlayerData(gameData.playerData);
            }
            if (gameData.statistics) {
                this.saveStatistics(gameData.statistics);
            }
            
            return true;
        } catch (error) {
            console.warn('Failed to import data:', error);
            return false;
        }
    }

    // Check if storage is available
    static isStorageAvailable() {
        try {
            return typeof(Storage) !== "undefined";
        } catch {
            return false;
        }
    }
}