import PlayerQueue from "@/src/player-queue";
import { TODO } from "@/src/types";

export const skipCommand = (message: TODO) => {
  if (message.member.id !== process.env.OWNER_ID)
    return message.reply("Only owner can do this (for now) ");
  PlayerQueue.skip(message);

  return message.reply("Song skipped!");
};
