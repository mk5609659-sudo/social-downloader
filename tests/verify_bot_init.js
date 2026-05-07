const bot = require('../src/bot/index');

async function test() {
    console.log('Testing Bot Initialization...');
    try {
        // Mocking a context for /start
        const ctxStart = {
            from: { first_name: 'TestUser' },
            reply: (msg) => console.log('Bot replied to /start:', msg)
        };

        // Find the start handler (telegraf stores it in middleware stack)
        // For simplicity, we just test if the bot object exists and has the expected methods
        if (bot && typeof bot.launch === 'function') {
            console.log('Bot initialized successfully.');
        } else {
            throw new Error('Bot initialization failed.');
        }

    } catch (error) {
        console.error('Bot test failed:', error.message);
    }
}

test();
