require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const PREFIX = '!kb ';
const CLAUDE_PATH = '/opt/homebrew/bin/claude'; // Use absolute path
const PROMPT_PATH = path.join(__dirname, '../config/kb-prompt.md');

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    // Detailed Debug logging
    const logMsg = `[${new Date().toISOString()}] Msg from ${message.author.tag} in ${message.channel.id}: "${message.content}"`;
    console.log(logMsg);
    try { fs.appendFileSync('debug.log', logMsg + '\n'); } catch (e) { console.error('Log file error:', e); }

    if (message.author.bot) {
        console.log('Ignored: Author is bot');
        return;
    }

    // Check for prefix or specific channel if configured
    let userInput = '';

    if (message.content.startsWith(PREFIX)) {
        userInput = message.content.slice(PREFIX.length).trim();
    } else if (process.env.DISCORD_CHANNEL_ID && message.channel.id === process.env.DISCORD_CHANNEL_ID) {
        // If in the specific channel, treat the whole message as input
        userInput = message.content.trim();
    } else {
        // Ignore messages without prefix in other channels
        return;
    }

    if (!userInput) return;

    await message.reply('Processing... ⏳');

    try {
        const promptContent = fs.readFileSync(PROMPT_PATH, 'utf8');
        // Inject database ID into prompt or environment
        const env = {
            ...process.env,
            NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID
        };

        // Construct the full prompt: System Prompt + User Input
        // Note: Claude Code CLI typically takes the prompt as an argument.
        // We can pass the prompt file content AND the user input.

        // Strategy: 
        // 1. Read prompt file.
        // 2. Append user input.
        // 3. Pass to claude --print

        const fullPrompt = `${promptContent}\n\n---\n\nUSER_INPUT: "${userInput}"\n\nJSON Output:`;

        console.log(`Running Claude with input: ${userInput.substring(0, 50)}...`);

        // Use arguments from reference script
        const args = [
            '--print',
            '--allowedTools', 'mcp__notion__*,WebSearch,WebFetch',
            // Note: google-calendar is not needed for this bot, but notion is.
            // Added -y just in case (though --print usually implies non-interactive if tools are allowed)
        ];

        const claudeProcess = spawn(CLAUDE_PATH, args, {
            env: env,
            cwd: process.cwd()
        });

        // Pipe prompt to stdin
        claudeProcess.stdin.write(fullPrompt);
        claudeProcess.stdin.end();

        claudeProcess.on('error', (err) => {
            console.error('Failed to spawn Claude process:', err);
            fs.appendFileSync('debug.log', `[SPAWN ERROR] ${err.message}\n`);
            message.reply('❌ Error: Failed to start Claude engine.').catch(console.error);
        });

        let output = '';
        let errorOutput = '';

        claudeProcess.stdout.on('data', (data) => {
            const dataStr = data.toString();
            output += dataStr;
            console.log(`[Claude STDOUT] ${dataStr}`);
            try { fs.appendFileSync('debug.log', `[Claude STDOUT] ${dataStr}\n`); } catch (e) { }
        });

        claudeProcess.stderr.on('data', (data) => {
            const dataStr = data.toString();
            errorOutput += dataStr;
            console.error(`[Claude STDERR] ${dataStr}`);
            try { fs.appendFileSync('debug.log', `[Claude STDERR] ${dataStr}\n`); } catch (e) { }
        });

        claudeProcess.on('close', async (code) => {
            if (code !== 0) {
                console.error(`Claude process exited with code ${code}`);
                await message.reply(`Error: External process failed with code ${code}. Check logs.`);
                return;
            }

            // Parse valid JSON from output
            // Claude might output thinking process or other text, we need to find the JSON block.
            try {
                // Regex to find JSON block
                const jsonMatch = output.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const result = JSON.parse(jsonMatch[0]);

                    if (result.status === 'success') {
                        await message.reply(`✅ **Saved to Notion!**\n**Title:** ${result.title}\n**Summary:** ${result.summary}\n**Link:** <${result.url}>`);
                    } else {
                        await message.reply(`❌ **Error:** ${result.message || 'Unknown error'}`);
                    }
                } else {
                    // Fallback if no JSON found, just send raw output (truncated)
                    if (output.length > 1900) {
                        output = output.substring(0, 1900) + '...';
                    }
                    await message.reply(`⚠️ **Raw Output (No JSON detected):**\n\`\`\`\n${output}\n\`\`\``);
                }
            } catch (e) {
                console.error('JSON Parse Error:', e);
                await message.reply(`⚠️ **Error parsing result:**\n\`\`\`\n${output.substring(0, 1000)}\n\`\`\``);
            }
        });

    } catch (error) {
        console.error('Error spawning process:', error);
        await message.reply('❌ Internal bot error.');
    }
});

client.login(process.env.DISCORD_TOKEN);
