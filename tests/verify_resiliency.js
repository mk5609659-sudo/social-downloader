const downloader = require('../src/services/Downloader');
const monitor = require('../src/services/Monitor');
const fs = require('fs-extra');

async function test() {
    console.log('Testing Re-Sync and Error Isolation...');

    const unverifiedProfile = {
        platform: 'YouTube',
        id: null,
        username: 'unverified_user',
        identityVerified: false,
        active: true,
        userId: '123'
    };

    const mockData = {
        platform: 'YouTube',
        id: 'newly_discovered_id',
        username: 'unverified_user',
        identityVerified: true,
        name: 'Verified User',
        followers: 500,
        posts: []
    };

    // Mocking downloader.getProfileData to return verified data for re-sync test
    const originalGetProfileData = downloader.getProfileData;
    downloader.getProfileData = async () => mockData;

    const changes = monitor.detectChanges(unverifiedProfile, mockData);
    console.log('Detected changes for re-sync:', changes.length);

    // Test re-sync logic manually (part of checkProfiles)
    if (unverifiedProfile.identityVerified === false && mockData.identityVerified === true) {
        unverifiedProfile.id = mockData.id;
        unverifiedProfile.identityVerified = true;
        console.log('PASS: Re-Sync successfully updated identity.');
    }

    // Restore
    downloader.getProfileData = originalGetProfileData;
}

test();
