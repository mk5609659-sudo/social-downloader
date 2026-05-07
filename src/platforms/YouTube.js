const { google } = require('googleapis');
const { YOUTUBE_API_KEY } = require('../utils/config');

class YouTubeHandler {
    constructor() {
        this.youtube = google.youtube({
            version: 'v3',
            auth: YOUTUBE_API_KEY
        });
    }

    async getProfile(channelId) {
        try {
            const response = await this.youtube.channels.list({
                part: 'snippet,statistics,brandingSettings,contentDetails',
                id: channelId
            });

            if (!response.data.items || response.data.items.length === 0) {
                // Try searching by username if ID fails
                const searchResponse = await this.youtube.channels.list({
                    part: 'snippet,statistics,brandingSettings,contentDetails',
                    forUsername: channelId
                });
                if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
                    // Try search for handle
                    const handleSearch = await this.youtube.search.list({
                        part: 'snippet',
                        q: channelId,
                        type: 'channel',
                        maxResults: 1
                    });
                    if (handleSearch.data.items && handleSearch.data.items.length > 0) {
                        return this.getProfile(handleSearch.data.items[0].id.channelId);
                    }
                    throw new Error('Channel not found');
                }
                return this.formatChannelData(searchResponse.data.items[0]);
            }

            return this.formatChannelData(response.data.items[0]);
        } catch (error) {
            console.error('YouTube API Error:', error);
            throw error;
        }
    }

    formatChannelData(channel) {
        const snippet = channel.snippet;
        const stats = channel.statistics;
        const branding = channel.brandingSettings;

        return {
            platform: 'YouTube',
            id: channel.id,
            username: snippet.customUrl || snippet.title,
            name: snippet.title,
            bio: snippet.description,
            pfp: snippet.thumbnails.high.url,
            cover: branding.image ? branding.image.bannerExternalUrl : null,
            followers: stats.subscriberCount,
            isPrivate: false, // YouTube channels are public if you can find them via API
            posts: [], // To be populated
            raw: channel
        };
    }

    async getRecentVideos(channelId, maxResults = 10) {
        try {
            const response = await this.youtube.search.list({
                part: 'snippet',
                channelId: channelId,
                order: 'date',
                type: 'video',
                maxResults: maxResults
            });

            return response.data.items.map(item => ({
                id: item.id.videoId,
                title: item.snippet.title,
                url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                thumbnail: item.snippet.thumbnails.high.url,
                publishedAt: item.snippet.publishedAt
            }));
        } catch (error) {
            console.error('YouTube Search API Error:', error);
            return [];
        }
    }
}

module.exports = new YouTubeHandler();
