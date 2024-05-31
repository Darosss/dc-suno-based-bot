const { Client, GatewayIntentBits } = require("discord.js");
const { startPlayCommand } = require("./commands/start-play");
const { playCommand } = require("./commands/play");
const { skipCommand } = require("./commands/skip");
const { stopCommand } = require("./commands/stop");
const COMMANDS = require("./commands/commands-list");
const { addMultipleSongs } = require("./commands/add-multiple-songs");

const COMMANDS_PREFIX = process.env.COMMANDS_PREFIX;
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ]
});
client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}`);
});
client.on("messageCreate", async (message) => {
  if (message.content.startsWith(`${COMMANDS_PREFIX}${COMMANDS.PLAY}`))
    playCommand(message);
  else if (
    message.content.startsWith(
      `${COMMANDS_PREFIX}${COMMANDS.ADD_MULTIPLE_SONGS}`
    )
  ) {
    addMultipleSongs(message);
  } else if (
    message.content.startsWith(`${COMMANDS_PREFIX}${COMMANDS.START_PLAY}`)
  )
    startPlayCommand(message);
  else if (message.content.startsWith(`${COMMANDS_PREFIX}${COMMANDS.SKIP}`))
    skipCommand(message);
  else if (message.content.startsWith(`${COMMANDS_PREFIX}${COMMANDS.STOP}`))
    stopCommand(message);
});

client.login(process.env.BOT_TOKEN);

module.exports = client;
