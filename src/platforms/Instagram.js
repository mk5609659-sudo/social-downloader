const axios = require('axios');

class InstagramHandler {
    constructor() {
        this.api = axios.create({
            baseURL: 'https://www.instagram.com',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'X-IG-App-ID': '936619743392459' // Public App ID
            }
        });
    }

    async getProfile(username) {
        try {
            const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
            // Using the public JSON endpoint
            const response = await this.api.get(`/${cleanUsername}/?__a=1&__d=dis`);

            if (!response.data.graphql && !response.data.user) {
                throw new Error('User not found or rate limited');
            }

            const user = response.data.graphql ? response.data.graphql.user : response.data.user;

            const posts = (user.edge_owner_to_timeline_media ? user.edge_owner_to_timeline_media.edges : []).map(edge => ({
                id: edge.node.id,
                shortcode: edge.node.shortcode,
                url: `https://www.instagram.com/p/${edge.node.shortcode}/`,
                display_url: edge.node.display_url,
                isVideo: edge.node.is_video,
                caption: edge.node.edge_media_to_caption.edges.length > 0 ? edge.node.edge_media_to_caption.edges[0].node.text : ''
            }));

            return {
                platform: 'Instagram',
                id: user.id,
                username: user.username,
                name: user.full_name,
                bio: user.biography,
                pfp: user.profile_pic_url_hd || user.profile_pic_url,
                cover: null, // Instagram doesn't have profile covers
                followers: user.edge_followed_by ? user.edge_followed_by.count : user.follower_count,
                isPrivate: user.is_private,
                posts: user.is_private ? [] : posts,
                raw: user
            };
        } catch (error) {
            console.error('Instagram Handler Error:', error.message);
            throw error;
        }
    }
}

module.exports = new InstagramHandler();
