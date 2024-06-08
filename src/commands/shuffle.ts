import { Message, SlashCommandBuilder } from "discord.js";
import { COMMANDS } from "./commands-list";
import playerQueue from "../player-queue";
import { BaseExecuteOptions } from "../types";

const COMMAND_DATA = COMMANDS.shuffle;

const shuffleCommand = (message: Message) => {
  if (playerQueue.isEmpty())
    return message.reply("No songs to shuffle. Add some");

  playerQueue.shuffle();

  return message.reply(`Successfully shuffled'n
  Next song: \`${playerQueue.peek()?.name}\``);
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
