import PlayerQueue from "@/src/player-queue";
import { Message, SlashCommandBuilder } from "discord.js";
import { COMMANDS } from "./commands-list";
const COMMAND_DATA = COMMANDS.stop;

const stopCommand = (message: Message) => {
  if (message.member?.id !== process.env.OWNER_ID)
    return message.reply("Only owner can do this (for now) ");
  else {
    PlayerQueue.stop();

    return message.reply("Player stopped!");
  }
};

const data = new SlashCommandBuilder()
  .setName(COMMANDS.stop.name)
  .setDescription(COMMANDS.stop.description)
  .setDefaultMemberPermissions("0");

const needsToBeInSameVoiceChannel = true;

export {
  data,
  stopCommand as execute,
  COMMAND_DATA as command,
  stopCommand as executeAsText,
  needsToBeInSameVoiceChannel
};
