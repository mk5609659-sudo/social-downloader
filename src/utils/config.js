const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

const configPath = path.join(__dirname, '../../config.json');

let fileConfig = {};
if (fs.existsSync(configPath)) {
    try {
        fileConfig = fs.readJsonSync(configPath);
    } catch (err) {
        console.error('Error reading config.json:', err);
    }
}

function getConfig(key) {
    return process.env[key] || fileConfig[key];
}

module.exports = {
    TELEGRAM_TOKEN: getConfig('TELEGRAM_TOKEN'),
    YOUTUBE_API_KEY: getConfig('YOUTUBE_API_KEY'),
    DISCORD_BOT_TOKEN: getConfig('DISCORD_BOT_TOKEN'),
    // Add other config as needed
    getConfig
};
