const identityResolver = require('../src/services/IdentityResolver');

async function test() {
    console.log('Testing Identity Resolver...');

    const mockHandler = {
        getProfile: async (id) => {
            if (id === 'fail') throw new Error('Simulated failure');
            return { id: 'real_id', username: 'real_user' };
        }
    };

    console.log('Test successful resolution:');
    const success = await identityResolver.resolve(mockHandler, 'test_user');
    console.log('Result:', success.identityVerified ? 'Verified' : 'Unverified', success.id);

    console.log('\nTest fallback after 3 retries:');
    const fallback = await identityResolver.resolve(mockHandler, 'fail', { platform: 'TikTok' });
    console.log('Result:', fallback.identityVerified ? 'Verified' : 'Unverified', fallback.compositeId);
}

test();
