import PlayerQueue from "@/src/player-queue";
import { Message } from "discord.js";

export const stopCommand = (message: Message) => {
  if (message.member?.id !== process.env.OWNER_ID)
    return message.reply("Only owner can do this (for now) ");
  else {
    PlayerQueue.stop();

    return message.reply("Player stopped!");
  }
};

module.exports = { stopCommand };
