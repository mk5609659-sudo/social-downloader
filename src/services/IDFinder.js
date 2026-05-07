const downloader = require('./Downloader');

class IDFinderService {
    async find(id) {
        const platforms = ['youtube', 'discord', 'tiktok', 'instagram', 'facebook'];
        const results = [];

        for (const platform of platforms) {
            try {
                const data = await this.searchWithRetry(platform, id);
                if (data && data.identityVerified !== false) {
                    results.push(data);
                }
            } catch (error) {
                console.error(`IDFinder error on ${platform}:`, error.message);
            }
        }

        return results;
    }

    async searchWithRetry(platform, id) {
        let attempts = 0;
        const maxAttempts = 2; // Initial + 1 retry

        while (attempts < maxAttempts) {
            try {
                const data = await downloader.getProfileData(platform, id);
                if (data && data.identityVerified !== false && !data.isEphemeral) {
                    return data;
                }
                throw new Error('Not found');
            } catch (error) {
                attempts++;
                if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
        return null;
    }
}

module.exports = new IDFinderService();
