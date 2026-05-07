const monitor = require('../src/services/Monitor');

async function test() {
    console.log('Testing Change Detection Logic...');

    const oldData = {
        name: 'Old Name',
        username: 'user1',
        followers: 100,
        bio: 'Old Bio',
        pfp: 'url1',
        posts: [{ id: '1' }]
    };

    const newData = {
        name: 'New Name',
        username: 'user1',
        followers: 110,
        bio: 'New Bio',
        pfp: 'url2',
        posts: [{ id: '1' }, { id: '2' }]
    };

    const changes = monitor.detectChanges(oldData, newData);
    console.log('Detected Changes:', JSON.stringify(changes, null, 2));

    if (changes.length === 5) { // Name, Followers, Bio, PFP, New posts
        console.log('PASS: All changes detected.');
    } else {
        console.log('FAIL: Expected 5 changes, got ' + changes.length);
    }
}

test();
