const tiktokHandler = require('../src/platforms/TikTok');

async function test() {
    console.log('Testing TikTok Handler...');
    try {
        const profile = await tiktokHandler.getProfile('tiktok');
        console.log('Profile Name:', profile.name);
        console.log('Followers:', profile.followers);
        console.log('Posts found:', profile.posts.length);
    } catch (error) {
        console.log('TikTok Handler test failed (expected if API blocked or needs msToken):', error.message);
    }
}

test();
