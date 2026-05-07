const downloader = require('../src/services/Downloader');

async function test() {
    console.log('Testing Downloader Service Logic...');

    const mockData = {
        name: 'Test Profile',
        username: 'test_user',
        platform: 'Instagram',
        followers: 1234,
        bio: 'This is a test bio',
        pfp: 'https://example.com/pfp.jpg',
        cover: 'https://example.com/cover.jpg',
        isPrivate: false,
        posts: [
            { display_url: 'https://example.com/post1.jpg' },
            { display_url: 'https://example.com/post2.jpg' }
        ]
    };

    const message = downloader.formatProfileMessage(mockData);
    console.log('Formatted Message:\n', message);

    if (message.includes('test_user') && message.includes('Instagram')) {
        console.log('PASS: Message formatting correct.');
    } else {
        console.log('FAIL: Message formatting incorrect.');
    }
}

test();
