import { Client, GatewayIntentBits } from "discord.js";
import { startPlayCommand } from "./commands/start-play";
import { playCommand } from "./commands/play";
import { skipCommand } from "./commands/skip";
import { stopCommand } from "./commands/stop";
import { COMMANDS } from "./commands/commands-list";
import { addMultipleSongs } from "./commands/add-multiple-songs";

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
client.on("messageCreate", async (dcMessage) => {
  if (!dcMessage.content.startsWith(COMMANDS_PREFIX)) return;

  const messageContentWithoutPrefix = dcMessage.content.slice(
    COMMANDS_PREFIX.length
  );

  if (messageContentWithoutPrefix.startsWith(COMMANDS.play.name)) {
    playCommand(dcMessage, COMMANDS.play);
  } else if (
    messageContentWithoutPrefix.startsWith(COMMANDS["add many songs"].name)
  ) {
    addMultipleSongs(dcMessage, COMMANDS["add many songs"]);
  } else if (messageContentWithoutPrefix.startsWith(COMMANDS.radio.name))
    startPlayCommand(dcMessage);
  else if (messageContentWithoutPrefix.startsWith(COMMANDS.skip.name))
    skipCommand(dcMessage);
  else if (messageContentWithoutPrefix.startsWith(COMMANDS.stop.name))
    stopCommand(dcMessage);
});

client.login(process.env.BOT_TOKEN);

export { client };
