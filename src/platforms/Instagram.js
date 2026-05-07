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

    async getProfile(identifier) {
        try {
            let username = identifier;
            if (identifier.startsWith('http')) {
                const match = identifier.match(/instagram\.com\/([^/?#]+)/);
                if (match) username = match[1];
            }

            const cleanUsername = username.startsWith('@') ? username.slice(1) : username;

            // Try public JSON endpoint first
            let response;
            try {
                response = await this.api.get(`/${cleanUsername}/?__a=1&__d=dis`);
            } catch (err) {
                // If it fails (rate limited), try basic HTML parsing
                return await this.getProfileFromHTML(cleanUsername);
            }

            if (!response.data.graphql && !response.data.user) {
                return await this.getProfileFromHTML(cleanUsername);
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
                cover: null,
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

    async getProfileFromHTML(username) {
        const response = await this.api.get(`/${username}/`);
        const data = response.data;

        // Try extracting sharedData
        const sharedDataMatch = data.match(/window\._sharedData\s*=\s*({.*?});/);
        if (sharedDataMatch) {
            const sharedData = JSON.parse(sharedDataMatch[1]);
            const user = sharedData.entry_data.ProfilePage[0].graphql.user;
            return this.formatUserData(user);
        }

        // Meta tags fallback
        const nameMatch = data.match(/<meta property="og:title" content="(.*?)"/);
        const name = nameMatch ? nameMatch[1].split(' (@')[0] : username;

        const bioMatch = data.match(/<meta property="og:description" content="(.*?)"/);
        const bio = bioMatch ? bioMatch[1] : '';

        const pfpMatch = data.match(/<meta property="og:image" content="(.*?)"/);
        const pfp = pfpMatch ? pfpMatch[1] : null;

        return {
            platform: 'Instagram',
            id: null,
            username: username,
            name: name,
            bio: bio,
            pfp: pfp,
            cover: null,
            followers: 0,
            isPrivate: false,
            posts: [],
            raw: {}
        };
    }
}

module.exports = new InstagramHandler();
