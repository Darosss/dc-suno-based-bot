import { Client, Events, GatewayIntentBits } from "discord.js";
import { loadSlashCommands } from "./load-slash-commands";
import { ClientWithCommands } from "./types";
import { loadTextCommands } from "./load-text-commands";
import {
  checkExecuteOptions,
  componentInteractionSeparator,
  updateClientStatus
} from "./utils/dc.utils";
import { loadButtonInteractions } from "./load-button-interactions";
import ConfigsHandler from "./utils/configs.utils";

const COMMANDS_PREFIX = process.env.COMMANDS_PREFIX;
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
  loadButtonInteractions(client);

  updateClientStatus();
});
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    const customIdKey = interaction.customId
      .split(componentInteractionSeparator)
      .at(0);

    if (!customIdKey) return;
    const buttonInterraction = (
      interaction.client as ClientWithCommands
    ).buttonInteractions.get(customIdKey);

    buttonInterraction?.execute(interaction);
  } else if (interaction.isChatInputCommand()) {
    const command = (interaction.client as ClientWithCommands).commands.get(
      interaction.commandName
    );

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    try {
      const { canExecute, message } = checkExecuteOptions(
        command.executeOpts,
        interaction
      );

      if (canExecute) return await command.execute(interaction);

      return interaction.reply(message || "Something went wrong. Sorry");
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
  }
});

client.on(Events.MessageCreate, async (dcMessage) => {
  if (dcMessage.channelId !== ConfigsHandler.getConfigs().botComandsChannelId)
    return;
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

      const { canExecute, message } = checkExecuteOptions(
        txtCommandData.executeOpts,
        dcMessage
      );

      if (canExecute) return await txtCommandData.execute(dcMessage);

      return dcMessage.reply(message || "Something went wrong. Sorry");
    }
  }
});

client.login(process.env.BOT_TOKEN);

export { client };
