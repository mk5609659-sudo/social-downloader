const facebookHandler = require('../src/platforms/Facebook');

async function test() {
    console.log('Testing Facebook Handler...');
    try {
        const profile = await facebookHandler.getProfile('zuck');
        console.log('Profile Name:', profile.name);
    } catch (error) {
        console.log('Facebook Handler test failed:', error.message);
    }
}

test();
