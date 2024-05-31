import PlayerQueue from "@/src/player-queue";
import { getMp3FromMusicFolder } from "@/utils/mp3.utils";
import { Message } from "discord.js";

export const startPlayCommand = (message: Message) => {
  if (message.member?.id !== process.env.OWNER_ID)
    return message.reply("Only owner can do this (for now) ");
  const files = getMp3FromMusicFolder().sort(() => 0.5 - Math.random());

  files.forEach((mp3File) => {
    PlayerQueue.enqueue({
      name: mp3File,
      requester: message.author.id
    });
  });
  console.log(files, "aha");

  if (files.length === 0) {
    return message.reply("No music files found in the /music folder.");
  }

  const channel = message.member.voice.channel;
  if (!channel) {
    return message.reply("You need to join a voice channel first!");
  }

  PlayerQueue.setConnection(channel).then(() => {
    PlayerQueue.start(message);
  });
};
