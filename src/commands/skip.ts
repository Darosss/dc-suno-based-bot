import PlayerQueue from "@/src/player-queue";
import { Message } from "discord.js";

export const skipCommand = (message: Message) => {
  if (message.member?.id === process.env.OWNER_ID) {
  } else if (message.member?.id !== PlayerQueue.getCurrentSong()?.requester) {
    return message.reply("You can skip only yours songs");
  }

  const skipped = PlayerQueue.skip(message);

  return skipped ? message.reply("Song skipped!") : null;
};
