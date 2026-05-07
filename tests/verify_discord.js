const discordHandler = require('../src/platforms/Discord');

async function test() {
    console.log('Testing Discord Handler...');
    try {
        // Using a dummy/real User ID if possible, but without token it will fail
        const profile = await discordHandler.getProfile('123456789012345678');
        console.log('Profile Name:', profile.name);
    } catch (error) {
        console.log('Discord Handler test (logic check only as token is missing):', error.message);
    }
}

test();
