import { downloadMP3 } from "@/src/download-logic";
import { CommandsType } from "./commands-list";
import PlayerQueue from "@/src/player-queue";
import { getMp3FromMusicFolder } from "@/utils/mp3.utils";
import { TODO } from "@/src/types";
import { MUSIC_FOLDER } from "@/src/globals";
import { Message } from "discord.js";
import { removeCommandNameFromMessage } from "../utils/dc.utils";
const baseWrongMessageReply = (commandName: string) =>
  `Give me correct command - example: ${process.env.COMMANDS_PREFIX}${commandName} https://suno.com/song/04db00ab-f7d7-40f8-a584-124b096beb31`;

export const playCommand = async (message: TODO, commandData: CommandsType) => {
  const songUrlOrName = removeCommandNameFromMessage(
    message.content,
    commandData
  );
  if (!message.content.includes("https://suno.com/song/"))
    findByName(message, songUrlOrName);

  const songId = songUrlOrName.split("/").at(-1);

  if (!songId) {
    return message.reply(baseWrongMessageReply(commandData.name));
  } else {
    const { message: downloadMessage, fileName } = await downloadMP3(
      songUrlOrName,
      MUSIC_FOLDER
    );
    if (!fileName) return;

    const channel = message.member.voice.channel;
    if (!channel) {
      return message.reply("You need to join a voice channel first!");
    }

    PlayerQueue.setConnection(channel).then(() => {
      PlayerQueue.enqueue(fileName, {
        resume: true,
        message
      });
    });

    return message.reply(downloadMessage);
  }
};

const findByName = (message: Message, songName: string) => {
  const channel = message.member?.voice.channel;

  if (!channel) {
    return message.reply("You need to join a voice channel first!");
  }
  const files = getMp3FromMusicFolder();
  const foundName = files.find((name) => {
    return name.toLowerCase().includes(songName.trim().toLowerCase());
  });
  if (!foundName) return message.reply("No song with your search");

  PlayerQueue.setConnection(channel).then(() => {
    PlayerQueue.enqueue(foundName, {
      resume: true,
      message
    });
  });
  return message.reply(`Added ${foundName}`);
};
