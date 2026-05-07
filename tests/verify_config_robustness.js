const config = require('../src/utils/config');
const fs = require('fs-extra');

async function test() {
    console.log('Testing Config Robustness...');

    console.log('Current status:', config.status);

    if (config.isFeatureEnabled('telegram')) {
        console.log('Telegram config found.');
    } else {
        console.log('Telegram config missing (handled).');
    }
}

test();
