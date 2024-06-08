import PlayerQueue from "@/src/player-queue";
import { Message, SlashCommandBuilder } from "discord.js";
import { COMMANDS } from "./commands-list";
import { BaseExecuteOptions } from "../types";

const COMMAND_DATA = COMMANDS.skip;

const skipCommand = (message: Message) => {
  if (
    message.member?.id !== process.env.OWNER_ID &&
    message.member?.id !== PlayerQueue.getCurrentSong()?.requester
  ) {
    return message.reply("You can skip only yours songs");
  }

  const skipped = PlayerQueue.skip();
  return skipped
    ? message.reply("Song skipped!")
    : message.reply("Last song in player skipped");
};

const data = new SlashCommandBuilder()
  .setName(COMMAND_DATA.name)
  .setDescription(COMMAND_DATA.description);

const executeOpts: BaseExecuteOptions = {
  needsToBeInSameVoiceChannel: true
};
export {
  data,
  skipCommand as execute,
  COMMAND_DATA as command,
  skipCommand as executeAsText,
  executeOpts
};
