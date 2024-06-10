import { Message, SlashCommandBuilder } from "discord.js";
import { COMMANDS } from "./commands-list";
import ConfigsHandler from "../utils/configs.utils";

const COMMAND_DATA = COMMANDS.configs;

const getConfigs = (message: Message) => {
  const currentConfigs = ConfigsHandler.getConfigs();

  const configsMessage = Object.entries(currentConfigs).map(
    ([key, value]) => `\`${key}: ${value}\``
  );
  return message.reply(`Current bot configs: \n ${configsMessage.join("\n")}`);
};

const data = new SlashCommandBuilder()
  .setName(COMMAND_DATA.name)
  .setDescription(COMMAND_DATA.description);

export {
  data,
  getConfigs as execute,
  COMMAND_DATA as command,
  getConfigs as executeAsText
};
