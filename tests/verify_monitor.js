const monitor = require('../src/services/Monitor');

async function test() {
    console.log('Testing Notification Formatting...');

    const oldData = { name: 'Test', username: 'test', platform: 'YouTube', followers: 100 };
    const newData = { name: 'Test', username: 'test', platform: 'YouTube', followers: 200 };
    const changes = [{ field: 'Follower count', old: 100, new: 200 }];

    const botMock = {
        telegram: {
            sendMessage: (userId, msg) => {
                console.log(`Sending to ${userId}:\n${msg}`);
                return Promise.resolve();
            }
        }
    };

    await monitor.notifyChanges(botMock, '12345', oldData, newData, changes);
    console.log('Notification test completed.');
}

test();
