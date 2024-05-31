import PlayerQueue from "@/src/player-queue";
import { getMp3FromMusicFolder } from "@/utils/mp3.utils";
import { Message } from "discord.js";
import { CommandsType } from "./commands-list";
import { DEFAULT_MAX_RADIO_SONGS } from "@/src/globals";
import { removeCommandNameFromMessage } from "../utils/dc.utils";

export const startPlayCommand = (
  message: Message,
  commandData: CommandsType
) => {
  if (message.member?.id !== process.env.OWNER_ID)
    return message.reply("Only owner can do this (for now) ");

  const files = getMp3FromMusicFolder().sort(() => 0.5 - Math.random());
  let maxSongs =
    files.length > DEFAULT_MAX_RADIO_SONGS
      ? DEFAULT_MAX_RADIO_SONGS
      : files.length;

  const numberOfSongs = Number(
    removeCommandNameFromMessage(message.content, commandData)
  );

  if (
    numberOfSongs !== 0 &&
    !isNaN(numberOfSongs) &&
    numberOfSongs < DEFAULT_MAX_RADIO_SONGS
  ) {
    maxSongs = files.length > numberOfSongs ? numberOfSongs : files.length;
  }

  for (let songIndex = 0; songIndex < maxSongs; songIndex++) {
    PlayerQueue.enqueue({
      name: files[songIndex],
      requester: message.author.id
    });
  }

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
