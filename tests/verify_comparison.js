const monitor = require('../src/services/Monitor');

async function test() {
    console.log('Testing Change Detection Logic...');

    const oldData = {
        name: 'Old Name',
        username: 'user1',
        followers: 100,
        bio: 'Old Bio',
        pfp: 'url1',
        cover: 'c1',
        posts: [{ id: '1' }, { id: 'delete_me' }]
    };

    const newData = {
        name: 'New Name',
        username: 'new_user',
        followers: 110,
        bio: 'New Bio',
        pfp: 'url2',
        cover: 'c2',
        posts: [{ id: '1' }, { id: '2' }]
    };

    const changes = monitor.detectChanges(oldData, newData);
    console.log('Detected Changes:', JSON.stringify(changes, null, 2));

    const fields = changes.map(c => c.field);
    const expectedFields = ['Follower count', 'Bio', 'Profile picture', 'Name', 'Username', 'Cover photo', 'New posts', 'Deleted posts'];

    let allFound = true;
    expectedFields.forEach(f => {
        if (!fields.includes(f)) {
            console.log(`FAIL: Missing field ${f}`);
            allFound = false;
        }
    });

    if (allFound) {
        console.log('PASS: All changes detected.');
    } else {
        console.log('FAIL: Some changes were not detected.');
    }
}

test();
