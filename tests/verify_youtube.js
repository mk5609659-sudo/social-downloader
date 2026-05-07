const youtubeHandler = require('../src/platforms/YouTube');

async function test() {
    console.log('Testing YouTube Handler...');
    try {
        // Using Google's channel ID as an example
        const profile = await youtubeHandler.getProfile('UC_x5XG1OV2P6uZZ5FSM9Ttw');
        console.log('Profile Name:', profile.name);
        console.log('Subscribers:', profile.followers);

        const videos = await youtubeHandler.getRecentVideos(profile.id, 5);
        console.log('Recent Videos:', videos.length);

        if (profile.name && videos) {
            console.log('YouTube Handler test passed (at least logic-wise, requires API key for real run)');
        }
    } catch (error) {
        console.error('YouTube Handler test failed:', error.message);
        if (error.message.includes('API key not valid')) {
            console.log('Note: This test requires a valid YOUTUBE_API_KEY in .env or config.json');
        }
    }
}

test();
