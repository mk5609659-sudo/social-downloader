const idFinder = require('../src/services/IDFinder');
const downloader = require('../src/services/Downloader');

async function test() {
    console.log('Testing IDFinder...');

    const originalGetProfileData = downloader.getProfileData;

    // Mock successful find
    downloader.getProfileData = async (plt, id) => {
        if (plt === 'youtube' && id === 'found_id') {
            return { platform: 'YouTube', id: 'found_id', username: 'found_user', identityVerified: true };
        }
        throw new Error('Not found');
    };

    console.log('Searching for "found_id":');
    const results = await idFinder.find('found_id');
    console.log('Results count:', results.length);
    if (results.length > 0 && results[0].id === 'found_id') {
        console.log('PASS: ID found correctly.');
    } else {
        console.log('FAIL: ID not found.');
    }

    // Mock failure with retry log
    let attempts = 0;
    downloader.getProfileData = async () => {
        attempts++;
        console.log(`Attempt ${attempts}`);
        throw new Error('Always fails');
    };

    console.log('\nSearching for "nonexistent_id":');
    const noResults = await idFinder.find('nonexistent_id');
    console.log('Results count:', noResults.length);
    if (noResults.length === 0) {
        console.log('PASS: Correctly returned empty for nonexistent ID.');
    }

    // Restore
    downloader.getProfileData = originalGetProfileData;
}

test();
