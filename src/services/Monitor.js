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
                // Use profile.id primarily, fallback to profile.username
                const newData = await downloader.getProfileData(profile.platform, profile.id || profile.username);

                // Re-Sync mechanism: if we now have a verified identity (ID), update the record
                if (profile.identityVerified === false && newData.identityVerified === true) {
                    console.log(`Re-Sync: Upgraded identity for ${profile.username} on ${profile.platform}`);
                    profile.id = newData.id;
                    profile.identityVerified = true;
                }

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
                // Isolate failure: logging it but allowing others to continue
                console.error(`Isolated error monitoring ${profile.username} on ${profile.platform}:`, error.message);
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

        if (oldData.username !== newData.username) {
            changes.push({
                field: 'Username',
                old: oldData.username,
                new: newData.username
            });
        }

        if (oldData.cover !== newData.cover) {
            changes.push({
                field: 'Cover photo',
                old: 'Changed',
                new: 'New cover'
            });
        }

        // Post detection
        const oldPostsIds = (oldData.posts || []).map(p => p.id);
        const newPostsIds = (newData.posts || []).map(p => p.id);

        const newPosts = (newData.posts || []).filter(p => !oldPostsIds.includes(p.id));
        const deletedPostsCount = oldPostsIds.filter(id => !newPostsIds.includes(id)).length;

        if (newPosts.length > 0) {
            changes.push({
                field: 'New posts',
                old: oldData.posts ? oldData.posts.length : 0,
                new: newData.posts.length,
                details: `${newPosts.length} new post(s) uploaded`
            });
        }

        if (deletedPostsCount > 0) {
            changes.push({
                field: 'Deleted posts',
                old: oldData.posts ? oldData.posts.length : 0,
                new: newData.posts.length,
                details: `${deletedPostsCount} post(s) deleted`
            });
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
