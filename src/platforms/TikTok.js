const { getUser, getUserPosts } = require('@rediska1114/tiktok-api');

class TikTokHandler {
    async getProfile(username) {
        try {
            // Remove @ if present
            const cleanUsername = username.startsWith('@') ? username.slice(1) : username;

            const userResult = await getUser(cleanUsername, undefined, 'US');
            if (userResult.error) {
                throw new Error(`TikTok API Error: ${userResult.error}`);
            }

            const userInfo = userResult.data.userInfo;
            const user = userInfo.user;
            const stats = userInfo.stats;

            let posts = [];
            try {
                const postsResult = await getUserPosts(user.secUid, undefined, 10, 'US', userResult.msToken);
                if (!postsResult.error) {
                    posts = postsResult.data.itemList.map(item => ({
                        id: item.id,
                        desc: item.desc,
                        url: `https://www.tiktok.com/@${user.uniqueId}/video/${item.id}`,
                        cover: item.video.cover,
                        playAddr: item.video.playAddr
                    }));
                }
            } catch (err) {
                console.error('Error fetching TikTok posts:', err);
            }

            return {
                platform: 'TikTok',
                id: user.id,
                secUid: user.secUid,
                username: user.uniqueId,
                name: user.nickname,
                bio: user.signature,
                pfp: user.avatarLarger || user.avatarMedium || user.avatarThumb,
                cover: null, // TikTok doesn't have a traditional profile cover
                followers: stats.followerCount,
                isPrivate: user.privateAccount,
                posts: posts,
                raw: userInfo
            };
        } catch (error) {
            console.error('TikTok Handler Error:', error.message);
            throw error;
        }
    }
}

module.exports = new TikTokHandler();
