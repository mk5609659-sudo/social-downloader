const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

const configPath = path.join(__dirname, '../../config.json');

let fileConfig = {};
try {
    if (fs.existsSync(configPath)) {
        fileConfig = fs.readJsonSync(configPath);
    }
} catch (err) {
    console.error('Error reading or parsing config.json:', err.message);
}

const config = {
    TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN || fileConfig.TELEGRAM_TOKEN,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || fileConfig.YOUTUBE_API_KEY,
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN || fileConfig.DISCORD_BOT_TOKEN
};

const status = {
    telegram: !!config.TELEGRAM_TOKEN,
    youtube: !!config.YOUTUBE_API_KEY,
    discord: !!config.DISCORD_BOT_TOKEN
};

// Log status
Object.entries(status).forEach(([feature, available]) => {
    if (!available) {
        console.warn(`Feature [${feature}] is disabled due to missing configuration.`);
    }
});

function isFeatureEnabled(feature) {
    return !!status[feature];
}

module.exports = {
    ...config,
    isFeatureEnabled,
    status
};
