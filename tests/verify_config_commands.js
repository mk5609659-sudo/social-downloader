const bot = require('../src/bot/index');
const { saveMonitored, getSettings, saveSettings } = require('../src/utils/storage');
const fs = require('fs-extra');

async function test() {
    console.log('Testing Config Commands Logic...');

    // Mock monitored data
    await saveMonitored([
        { name: 'Test User', username: 'testuser', platform: 'YouTube', active: true }
    ]);

    console.log('Monitored data saved.');

    // Test interval validation (logic)
    const settings = await getSettings();
    settings.interval = 5;
    await saveSettings(settings);
    const savedSettings = await getSettings();
    if (savedSettings.interval === 5) {
        console.log('PASS: Interval setting saved.');
    } else {
        console.log('FAIL: Interval setting not saved.');
    }

    // Cleanup
    await fs.remove('data/monitored.json');
    await fs.remove('data/settings.json');
}

test();
