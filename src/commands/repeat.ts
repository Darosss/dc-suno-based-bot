import { Message, SlashCommandBuilder } from "discord.js";
import { COMMANDS } from "./commands-list";
import playerQueue from "../player-queue";
import { BaseExecuteOptions } from "../types";

const COMMAND_DATA = COMMANDS.repeat;

const shuffleCommand = (message: Message) => {
  playerQueue.setRepeat(!playerQueue.getRepeat());

  return message.reply(`Repeat is: ${playerQueue.getRepeat()}`);
};

const data = new SlashCommandBuilder()
  .setName(COMMAND_DATA.name)
  .setDescription(COMMAND_DATA.description)
  .setDefaultMemberPermissions("0");

const executeOpts: BaseExecuteOptions = {
  needsToBeInSameVoiceChannel: true,
  onlyOwner: true
};
export {
  data,
  shuffleCommand as execute,
  COMMAND_DATA as command,
  shuffleCommand as executeAsText,
  executeOpts
};
