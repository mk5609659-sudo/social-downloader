const axios = require('axios');
const { DISCORD_BOT_TOKEN } = require('../utils/config');

class DiscordHandler {
    constructor() {
        this.api = axios.create({
            baseURL: 'https://discord.com/api/v10',
            headers: {
                Authorization: `Bot ${DISCORD_BOT_TOKEN}`
            }
        });
    }

    async getProfile(userId) {
        try {
            const response = await this.api.get(`/users/${userId}`);
            return this.formatUserData(response.data);
        } catch (error) {
            console.error('Discord API Error:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    formatUserData(user) {
        const avatarUrl = user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=1024`
            : `https://cdn.discordapp.com/embed/avatars/${user.discriminator % 5}.png`;

        const bannerUrl = user.banner
            ? `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.png?size=1024`
            : null;

        return {
            platform: 'Discord',
            id: user.id,
            username: user.username,
            name: user.global_name || user.username,
            bio: user.bio || '', // Bio might require extra scopes or not be in public user object for bots
            pfp: avatarUrl,
            cover: bannerUrl,
            followers: 0, // Discord doesn't have public follower count for users
            isPrivate: false,
            posts: [], // Discord doesn't have public "posts" for users
            raw: user
        };
    }
}

module.exports = new DiscordHandler();
