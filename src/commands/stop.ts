import PlayerQueue from "@/src/player-queue";
import { Message, SlashCommandBuilder } from "discord.js";
import { COMMANDS } from "./commands-list";
import { BaseExecuteOptions } from "../types";
const COMMAND_DATA = COMMANDS.stop;

const stopCommand = (message: Message) => {
  PlayerQueue.stop();

  return message.reply("Player stopped!");
};

const data = new SlashCommandBuilder()
  .setName(COMMANDS.stop.name)
  .setDescription(COMMANDS.stop.description)
  .setDefaultMemberPermissions("0");

const executeOpts: BaseExecuteOptions = {
  needsToBeInSameVoiceChannel: true,
  onlyOwner: true
};
export {
  data,
  stopCommand as execute,
  COMMAND_DATA as command,
  stopCommand as executeAsText,
  executeOpts
};
