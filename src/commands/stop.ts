import { TODO } from "@/src/types";
import PlayerQueue from "@/src/player-queue";

export const stopCommand = (message: TODO) => {
  if (message.member.id !== process.env.OWNER_ID)
    return message.reply("Only owner can do this (for now) ");
  else {
    PlayerQueue.stop();

    return message.reply("Player stopped!");
  }
};

module.exports = { stopCommand };
