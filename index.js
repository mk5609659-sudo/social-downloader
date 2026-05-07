const bot = require('./src/bot');
const monitor = require('./src/services/Monitor');

async function start() {
    console.log('Starting Social Downloader Bot...');

    // Start the bot
    bot.launch().then(() => {
        console.log('Bot is live!');
    }).catch(err => {
        console.error('Failed to launch bot:', err.message);
    });

    // Start the monitor service
    monitor.start(bot);

    // Enable graceful stop
    process.once('SIGINT', () => {
        bot.stop('SIGINT');
        if (monitor.job) monitor.job.stop();
    });
    process.once('SIGTERM', () => {
        bot.stop('SIGTERM');
        if (monitor.job) monitor.job.stop();
    });
}

if (require.main === module) {
    start();
}
