import { Message, SlashCommandBuilder } from "discord.js";
import { COMMANDS } from "./commands-list";
import playerQueue from "../player-queue";

const COMMAND_DATA = COMMANDS.shuffle;

const shuffleCommand = (message: Message) => {
  if (message.member?.id !== process.env.OWNER_ID)
    return message.reply("Only owner can do this (for now) ");

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

const needsToBeInSameVoiceChannel = true;

export {
  data,
  shuffleCommand as execute,
  COMMAND_DATA as command,
  shuffleCommand as executeAsText,
  needsToBeInSameVoiceChannel
};
