const instagramHandler = require('../src/platforms/Instagram');

async function test() {
    console.log('Testing Instagram Handler...');
    try {
        const profile = await instagramHandler.getProfile('instagram');
        console.log('Profile Name:', profile.name);
        console.log('Followers:', profile.followers);
    } catch (error) {
        console.log('Instagram Handler test failed (expected if rate limited or endpoint changed):', error.message);
    }
}

test();
