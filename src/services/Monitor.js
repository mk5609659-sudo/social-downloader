const cron = require('node-cron');
const { getMonitored, saveMonitored, getSettings } = require('../utils/storage');
const downloader = require('./Downloader');

class MonitorService {
    constructor() {
        this.job = null;
    }

    async start(bot) {
        const settings = await getSettings();
        const interval = settings.interval || 3;

        if (this.job) this.job.stop();

        this.job = cron.schedule(`*/${interval} * * * *`, async () => {
            console.log('Running monitoring check...');
            await this.checkProfiles(bot);
        });

        console.log(`Monitor service started with ${interval} minute interval.`);
    }

    async checkProfiles(bot) {
        const monitored = await getMonitored();
        const updatedMonitored = [];

        for (const profile of monitored) {
            if (!profile.active) {
                updatedMonitored.push(profile);
                continue;
            }

            try {
                const newData = await downloader.getProfileData(profile.platform, profile.id || profile.username);
                const changes = this.detectChanges(profile, newData);

                if (changes.length > 0) {
                    await this.notifyChanges(bot, profile.userId, profile, newData, changes);
                    // Update stored data
                    updatedMonitored.push({
                        ...profile,
                        ...newData,
                        lastChecked: new Date().toISOString()
                    });
                } else {
                    updatedMonitored.push(profile);
                }
            } catch (error) {
                console.error(`Error monitoring ${profile.username} on ${profile.platform}:`, error.message);
                updatedMonitored.push(profile);
            }
        }

        await saveMonitored(updatedMonitored);
    }

    detectChanges(oldData, newData) {
        const changes = [];

        if (oldData.followers !== newData.followers) {
            changes.push({
                field: 'Follower count',
                old: oldData.followers,
                new: newData.followers
            });
        }

        if (oldData.bio !== newData.bio) {
            changes.push({
                field: 'Bio',
                old: oldData.bio,
                new: newData.bio
            });
        }

        if (oldData.pfp !== newData.pfp) {
            changes.push({
                field: 'Profile picture',
                old: 'Changed',
                new: 'New photo'
            });
        }

        if (oldData.name !== newData.name) {
            changes.push({
                field: 'Name',
                old: oldData.name,
                new: newData.name
            });
        }

        // Post detection (simplified)
        if (newData.posts && newData.posts.length > 0) {
            const oldPostsIds = (oldData.posts || []).map(p => p.id);
            const newPosts = newData.posts.filter(p => !oldPostsIds.includes(p.id));
            if (newPosts.length > 0) {
                changes.push({
                    field: 'New posts',
                    old: oldData.posts ? oldData.posts.length : 0,
                    new: newData.posts.length,
                    details: `${newPosts.length} new post(s) uploaded`
                });
            }
        }

        return changes;
    }

    async notifyChanges(bot, userId, oldData, newData, changes) {
        let message = `🔔 <b>Profile Update Detected!</b>\n\n`;
        message += `Profile: <b>${newData.name}</b> (@${newData.username})\n`;
        message += `Platform: ${newData.platform}\n`;
        message += `Date: ${new Date().toLocaleString()}\n\n`;
        message += `<b>Changes:</b>\n`;

        changes.forEach(c => {
            message += `• ${c.field}: ${c.old} ➔ ${c.new}\n`;
            if (c.details) message += `  <i>${c.details}</i>\n`;
        });

        try {
            await bot.telegram.sendMessage(userId, message, { parse_mode: 'HTML' });
        } catch (error) {
            console.error(`Failed to send notification to ${userId}:`, error.message);
        }
    }
}

module.exports = new MonitorService();
