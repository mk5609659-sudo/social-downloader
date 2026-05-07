const fs = require('fs-extra');
const path = require('path');

const monitoredPath = path.join(__dirname, '../../data/monitored.json');
const settingsPath = path.join(__dirname, '../../data/settings.json');

async function getMonitored() {
    if (!fs.existsSync(monitoredPath)) return [];
    return fs.readJson(monitoredPath);
}

async function saveMonitored(data) {
    await fs.ensureDir(path.dirname(monitoredPath));
    await fs.writeJson(monitoredPath, data, { spaces: 2 });
}

async function getSettings() {
    if (!fs.existsSync(settingsPath)) return { interval: 3, platforms: {} };
    return fs.readJson(settingsPath);
}

async function saveSettings(settings) {
    await fs.ensureDir(path.dirname(settingsPath));
    await fs.writeJson(settingsPath, settings, { spaces: 2 });
}

module.exports = {
    getMonitored,
    saveMonitored,
    getSettings,
    saveSettings
};
