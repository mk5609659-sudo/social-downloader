const urlRegex = /(https?:\/\/[^\s]+)/g;

const patterns = {
    youtube: /(youtube\.com|youtu\.be)/i,
    facebook: /(facebook\.com|fb\.watch)/i,
    instagram: /instagram\.com/i,
    tiktok: /tiktok\.com/i,
    discord: /discord\.com\/users/i // Discord profile links are usually /users/ID
};

function detectPlatform(url) {
    for (const [platform, pattern] of Object.entries(patterns)) {
        if (pattern.test(url)) {
            return platform;
        }
    }
    return null;
}

const linkDetectionMiddleware = async (ctx, next) => {
    if (ctx.message && ctx.message.text && !ctx.message.text.startsWith('/')) {
        const text = ctx.message.text;
        const urls = text.match(urlRegex);

        if (urls && urls.length > 0) {
            const url = urls[0];
            const platform = detectPlatform(url);

            if (platform) {
                await ctx.reply('Direct link detected.');
                await ctx.reply(`Link detection successful: ${platform.charAt(0).toUpperCase() + platform.slice(1)}.`);

                // Store detected info in state for the next step (download)
                ctx.state.detectedPlatform = platform;
                ctx.state.detectedUrl = url;
            }
        }
    }
    return next();
};

module.exports = {
    linkDetectionMiddleware,
    detectPlatform
};
