const { Telegraf, Markup } = require('telegraf');
const { TELEGRAM_TOKEN } = require('../utils/config');
const { getMonitored, getSettings, saveSettings, saveMonitored } = require('../utils/storage');
const downloader = require('../services/Downloader');

const { linkDetectionMiddleware, detectPlatform } = require('./middleware');

const bot = new Telegraf(TELEGRAM_TOKEN || 'DUMMY_TOKEN');

bot.use(linkDetectionMiddleware);

if (!TELEGRAM_TOKEN) {
    console.warn('TELEGRAM_TOKEN is not set! Bot will not be able to start for real.');
}

bot.start((ctx) => {
    ctx.reply(`Welcome ${ctx.from.first_name}! I am a Social Downloader Bot.\nUse /help to see what I can do.`);
});

bot.help((ctx) => {
    ctx.reply('Choose a platform to download from:', Markup.inlineKeyboard([
        [Markup.button.callback('Facebook', 'plt_facebook'), Markup.button.callback('Instagram', 'plt_instagram')],
        [Markup.button.callback('TikTok', 'plt_tiktok'), Markup.button.callback('YouTube', 'plt_youtube')],
        [Markup.button.callback('Discord', 'plt_discord')]
    ]));
});

bot.command('list', async (ctx) => {
    const monitored = await getMonitored();
    if (monitored.length === 0) {
        return ctx.reply('No monitored profiles.');
    }

    let message = 'Monitored Profiles:\n\n';
    monitored.forEach((p, index) => {
        message += `${index + 1}. ${p.name} (@${p.username})\n`;
        message += `Platform: ${p.platform}\n`;
        message += `Status: ${p.active ? '✅ Active' : '❌ Inactive'}\n\n`;
    });

    ctx.reply(message);
});

bot.command('configuration', async (ctx) => {
    const settings = await getSettings();
    ctx.reply(`Configuration Menu:\nCurrent Interval: ${settings.interval} minutes\n\nChoose an option:`, Markup.inlineKeyboard([
        [Markup.button.callback('Set Interval', 'cfg_set_interval')],
        [Markup.button.callback('Manage Profiles', 'cfg_manage_profiles')],
        [Markup.button.callback('Toggle Platforms', 'cfg_toggle_platforms')]
    ]));
});

bot.action('cfg_set_interval', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('Please send the monitoring interval in minutes (minimum 3):');
});

bot.action('cfg_manage_profiles', async (ctx) => {
    ctx.answerCbQuery();
    const monitored = await getMonitored();
    if (monitored.length === 0) {
        return ctx.reply('No profiles to manage. Add one by sending a link first.');
    }

    const buttons = monitored.map(p => [Markup.button.callback(`${p.active ? '✅' : '❌'} ${p.username} (${p.platform})`, `toggle_profile_${p.id || p.username}`)]);
    ctx.reply('Select a profile to toggle active/inactive:', Markup.inlineKeyboard(buttons));
});

bot.action(/^toggle_profile_(.+)$/, async (ctx) => {
    const id = ctx.match[1];
    const monitored = await getMonitored();
    const profile = monitored.find(p => (p.id || p.username) === id);
    if (profile) {
        profile.active = !profile.active;
        await saveMonitored(monitored);
        ctx.answerCbQuery(`${profile.username} is now ${profile.active ? 'active' : 'inactive'}`);
        // Refresh menu
        ctx.editMessageText('Select a profile to toggle active/inactive:', Markup.inlineKeyboard(
            monitored.map(p => [Markup.button.callback(`${p.active ? '✅' : '❌'} ${p.username} (${p.platform})`, `toggle_profile_${p.id || p.username}`)])
        ));
    }
});

bot.action('cfg_toggle_platforms', async (ctx) => {
    ctx.answerCbQuery();
    const settings = await getSettings();
    if (!settings.platforms) settings.platforms = {};

    const buttons = platforms.map(p => [Markup.button.callback(`${settings.platforms[p] !== false ? '✅' : '❌'} ${p.charAt(0).toUpperCase() + p.slice(1)}`, `toggle_plt_${p}`)]);
    ctx.reply('Toggle monitoring for specific platforms:', Markup.inlineKeyboard(buttons));
});

bot.action(/^toggle_plt_(.+)$/, async (ctx) => {
    const plt = ctx.match[1];
    const settings = await getSettings();
    if (!settings.platforms) settings.platforms = {};
    settings.platforms[plt] = settings.platforms[plt] === false ? true : false;
    await saveSettings(settings);
    ctx.answerCbQuery(`${plt} is now ${settings.platforms[plt] ? 'enabled' : 'disabled'}`);

    ctx.editMessageText('Toggle monitoring for specific platforms:', Markup.inlineKeyboard(
        platforms.map(p => [Markup.button.callback(`${settings.platforms[p] !== false ? '✅' : '❌'} ${p.charAt(0).toUpperCase() + p.slice(1)}`, `toggle_plt_${p}`)])
    ));
});

bot.on('text', async (ctx, next) => {
    // Handle link detection if it was set by middleware
    if (ctx.state.detectedPlatform && ctx.state.detectedUrl) {
        try {
            const data = await downloader.getProfileData(ctx.state.detectedPlatform, ctx.state.detectedUrl);
            await downloader.sendProfileInfo(ctx, data);

            // Add to monitoring
            const monitored = await getMonitored();
            if (!monitored.find(p => p.platform === data.platform && (p.id === data.id || p.username === data.username))) {
                monitored.push({
                    ...data,
                    userId: ctx.from.id,
                    active: true,
                    lastChecked: new Date().toISOString()
                });
                await saveMonitored(monitored);
                ctx.reply('Profile added to monitoring list.');
            }
        } catch (error) {
            ctx.reply(`Error downloading: ${error.message}`);
        }
        return;
    }

    // Handle replies for manual platform input
    if (ctx.message.reply_to_message && ctx.message.reply_to_message.text.includes('Please send the')) {
        const platformMatch = ctx.message.reply_to_message.text.match(/Please send the (.*?) link/);
        if (platformMatch) {
            const platform = platformMatch[1];
            try {
                const data = await downloader.getProfileData(platform, ctx.message.text);
                await downloader.sendProfileInfo(ctx, data);

                // Add to monitoring
                const monitored = await getMonitored();
                if (!monitored.find(p => p.platform === data.platform && (p.id === data.id || p.username === data.username))) {
                    monitored.push({
                        ...data,
                        userId: ctx.from.id,
                        active: true,
                        lastChecked: new Date().toISOString()
                    });
                    await saveMonitored(monitored);
                    ctx.reply('Profile added to monitoring list.');
                }
            } catch (error) {
                ctx.reply(`Error downloading: ${error.message}`);
            }
            return;
        }
    }

    if (ctx.message.reply_to_message && ctx.message.reply_to_message.text.includes('monitoring interval')) {
        const interval = parseInt(ctx.message.text);
        if (isNaN(interval) || interval < 3) {
            return ctx.reply('Invalid interval. Minimum is 3 minutes.');
        }
        const settings = await getSettings();
        settings.interval = interval;
        await saveSettings(settings);
        return ctx.reply(`Interval set to ${interval} minutes.`);
    }
    return next();
});

// Platform selection handlers
const platforms = ['facebook', 'instagram', 'tiktok', 'youtube', 'discord'];
platforms.forEach(platform => {
    bot.action(`plt_${platform}`, (ctx) => {
        ctx.answerCbQuery();
        ctx.reply(`Please send the ${platform.charAt(0).toUpperCase() + platform.slice(1)} link or profile ID:`);
    });
});

module.exports = bot;
