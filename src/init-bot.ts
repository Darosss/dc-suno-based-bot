import { ActivityType, Client, Events, GatewayIntentBits } from "discord.js";
import { COMMANDS } from "./commands/commands-list";
import { loadSlashCommands } from "./load-slash-commands";
import { ClientWithCommands } from "./types";
import { loadTextCommands } from "./load-text-commands";
import { canUserUseCommands } from "./utils/dc.utils";

const COMMANDS_PREFIX = process.env.COMMANDS_PREFIX;
const BOT_COMMAND_CHANNEL_ID = process.env.BOT_COMMANDS_CHANNEL_ID;
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ]
}) as ClientWithCommands;
client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}`);

  loadSlashCommands(client);
  loadTextCommands(client);

  client.user?.setPresence({
    activities: [
      {
        name: `*${process.env.COMMANDS_PREFIX}${COMMANDS.commands.name}* for help`,
        type: ActivityType.Custom,
        state: ""
      }
    ]
  });
});
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = (interaction.client as ClientWithCommands).commands.get(
    interaction.commandName
  );

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true
      });
    }
  }
});

client.on(Events.MessageCreate, async (dcMessage) => {
  if (dcMessage.channelId !== BOT_COMMAND_CHANNEL_ID) return;
  if (!dcMessage.content.startsWith(COMMANDS_PREFIX)) return;

  const messageContentWithoutPrefix = dcMessage.content.slice(
    COMMANDS_PREFIX.length
  );

  const arrayOfTxtCommandsKeys = [...client.textCommands.keys()];
  for (let index = 0; index < arrayOfTxtCommandsKeys.length; index++) {
    const currentKey = arrayOfTxtCommandsKeys.at(index);
    if (!currentKey) continue;

    if (messageContentWithoutPrefix.startsWith(currentKey)) {
      const txtCommandData = client.textCommands.get(currentKey)!;

      if (
        txtCommandData.needsToBeInSameVoiceChannel &&
        !canUserUseCommands(dcMessage)
      )
        return;

      await txtCommandData.execute(dcMessage);
    }
  }
});

client.login(process.env.BOT_TOKEN);

export { client };
