import { Message, SlashCommandBuilder } from "discord.js";
import { COMMANDS } from "./commands-list";
import playerQueue from "../player-queue";

const COMMAND_DATA = COMMANDS.repeat;

const shuffleCommand = (message: Message) => {
  if (message.member?.id !== process.env.OWNER_ID)
    return message.reply("Only owner can do this (for now) ");

  playerQueue.setRepeat(!playerQueue.getRepeat());

  return message.reply(`Repeat is: ${playerQueue.getRepeat()}`);
};

const data = new SlashCommandBuilder()
  .setName(COMMAND_DATA.name)
  .setDescription(COMMAND_DATA.description)
  .setDefaultMemberPermissions("0");

const needsToBeInSameVoiceChannel = true;

export {
  data,
  shuffleCommand as execute,
  COMMAND_DATA as command,
  shuffleCommand as executeAsText,
  needsToBeInSameVoiceChannel
};
