class IdentityResolver {
    constructor() {
        this.maxRetries = 3;
        this.retryDelay = 2000; // 2 seconds
    }

    async resolve(platformHandler, identifier, options = {}) {
        let attempts = 0;
        let lastError = null;

        while (attempts < this.maxRetries) {
            try {
                const data = await platformHandler.getProfile(identifier);
                if (data && (data.id || data.username)) {
                    return {
                        ...data,
                        identityVerified: !!data.id
                    };
                }
                throw new Error('No identifier returned from platform');
            } catch (error) {
                attempts++;
                lastError = error;
                console.warn(`Attempt ${attempts} failed for ${identifier}: ${error.message}`);
                if (attempts < this.maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                }
            }
        }

        // Fallback to composite identifier
        console.warn(`Identity resolution failed for ${identifier} after ${this.maxRetries} attempts. Using fallback.`);

        return {
            platform: options.platform || 'Unknown',
            id: null,
            username: options.username || identifier,
            name: options.username || identifier,
            compositeId: `fallback_${options.platform || 'unknown'}_${identifier}`,
            identityVerified: false,
            isEphemeral: true,
            raw: {}
        };
    }
}

module.exports = new IdentityResolver();
