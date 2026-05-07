const youtube = require('../platforms/YouTube');
const instagram = require('../platforms/Instagram');
const tiktok = require('../platforms/TikTok');
const facebook = require('../platforms/Facebook');
const discord = require('../platforms/Discord');
const axios = require('axios');
const identityResolver = require('./IdentityResolver');

class DownloaderService {
    constructor() {
        this.handlers = {
            youtube,
            instagram,
            tiktok,
            facebook,
            discord
        };
    }

    async getProfileData(platform, identifier) {
        const handler = this.handlers[platform.toLowerCase()];
        if (!handler) throw new Error('Unsupported platform');

        return await identityResolver.resolve(handler, identifier, { platform });
    }

    async downloadToBuffer(url) {
        if (!url) return null;
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            return Buffer.from(response.data, 'binary');
        } catch (error) {
            console.error(`Failed to download ${url}:`, error.message);
            return null;
        }
    }

    formatProfileMessage(data) {
        let msg = `<b>${data.name}</b> (@${data.username})\n`;
        if (data.identityVerified === false) {
            msg = `⚠️ <b>Unverified Identity</b>\n` + msg;
        }
        msg += `Platform: ${data.platform}\n`;
        if (data.followers) msg += `Followers: ${data.followers.toLocaleString()}\n`;
        if (data.bio) msg += `\nBio: ${data.bio}\n`;
        if (data.isPrivate) msg += `\n🔒 <i>Profile is private. Only profile picture and cover are available.</i>`;
        return msg;
    }

    async sendProfileInfo(ctx, data) {
        const caption = this.formatProfileMessage(data);
        const media = [];

        if (data.pfp) {
            media.push({ type: 'photo', media: data.pfp, caption: caption, parse_mode: 'HTML' });
        }
        if (data.cover) {
            media.push({ type: 'photo', media: data.cover });
        }

        if (media.length > 0) {
            // Split media into chunks of 10 for Telegram limit
            for (let i = 0; i < media.length; i += 10) {
                await ctx.sendMediaGroup(media.slice(i, i + 10));
            }
        } else {
            await ctx.reply(caption, { parse_mode: 'HTML' });
        }

        if (!data.isPrivate && data.posts && data.posts.length > 0) {
            const postMedia = data.posts.map(post => ({
                type: 'photo',
                media: post.display_url || post.cover || post.thumbnail
            })).filter(m => m.media);

            if (postMedia.length > 0) {
                await ctx.reply('Recent Posts:');
                // Split media into chunks of 10 for Telegram limit
                for (let i = 0; i < postMedia.length; i += 10) {
                    await ctx.sendMediaGroup(postMedia.slice(i, i + 10));
                }
            }
        }

        // Highlights/Stories check
        if (data.platform === 'Instagram') {
            await ctx.reply('Highlights not possible.');
        }
    }
}

module.exports = new DownloaderService();
