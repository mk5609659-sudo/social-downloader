const axios = require('axios');

class FacebookHandler {
    constructor() {
        this.api = axios.create({
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });
    }

    async getProfile(identifier) {
        try {
            let url = identifier;
            if (!identifier.startsWith('http')) {
                url = `https://www.facebook.com/${identifier}`;
            }

            const response = await this.api.get(url);

            // Extract Name
            const nameMatch = response.data.match(/<title>(.*?)<\/title>/);
            const name = nameMatch ? nameMatch[1].replace(' | Facebook', '').trim() : identifier;

            // Extract UserID from various possible locations in HTML
            let userId = null;
            const idMatch = response.data.match(/"userID":"(\d+)"/) ||
                          response.data.match(/"author_id":(\d+)/) ||
                          response.data.match(/fb:\/\/profile\/(\d+)/);

            if (idMatch) userId = idMatch[1];

            // Extract Bio
            const bioMatch = response.data.match(/"description":"(.*?)"/) ||
                           response.data.match(/<meta property="og:description" content="(.*?)"/);
            const bio = bioMatch ? bioMatch[1] : '';

            // Extract Followers (very rough regex)
            const followersMatch = response.data.match(/([\d.,KMB]+)\sfollowers/i);
            const followersCount = followersMatch ? this.parseFollowers(followersMatch[1]) : 0;

            // Extract Images
            const pfpMatch = response.data.match(/"profile_pic_url":"(.*?)"/) ||
                           response.data.match(/<meta property="og:image" content="(.*?)"/);
            const pfp = pfpMatch ? pfpMatch[1].replace(/\\/g, '') : null;

            return {
                platform: 'Facebook',
                id: userId,
                username: identifier,
                name: name,
                bio: bio,
                pfp: pfp,
                cover: null,
                followers: followersCount,
                isPrivate: false,
                posts: [],
                raw: {}
            };
        } catch (error) {
            console.error('Facebook Handler Error:', error.message);
            throw error;
        }
    }

    parseFollowers(str) {
        const base = parseFloat(str.replace(/,/g, ''));
        if (str.includes('K')) return base * 1000;
        if (str.includes('M')) return base * 1000000;
        return base;
    }
}

module.exports = new FacebookHandler();
