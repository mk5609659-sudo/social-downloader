const { detectPlatform } = require('../src/bot/middleware');

const testCases = [
    { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expected: 'youtube' },
    { url: 'https://youtu.be/dQw4w9WgXcQ', expected: 'youtube' },
    { url: 'https://www.instagram.com/p/C_abc123/', expected: 'instagram' },
    { url: 'https://www.tiktok.com/@user/video/123', expected: 'tiktok' },
    { url: 'https://www.facebook.com/zuck', expected: 'facebook' },
    { url: 'https://discord.com/users/123456789', expected: 'discord' },
    { url: 'https://google.com', expected: null }
];

console.log('Testing Link Detection...');
let success = true;
testCases.forEach(tc => {
    const detected = detectPlatform(tc.url);
    if (detected === tc.expected) {
        console.log(`PASS: ${tc.url} -> ${detected}`);
    } else {
        console.log(`FAIL: ${tc.url} -> expected ${tc.expected}, got ${detected}`);
        success = false;
    }
});

if (success) {
    console.log('All link detection tests passed!');
} else {
    process.exit(1);
}
