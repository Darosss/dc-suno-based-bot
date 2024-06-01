import { downloadMP3 } from "@/src/download-logic";
import { CommandsType } from "./commands-list";
import PlayerQueue from "@/src/player-queue";
import { getMp3FromMusicFolder } from "@/utils/mp3.utils";
import { MUSIC_FOLDER } from "@/src/globals";
import { removeCommandNameFromMessage } from "@/utils/dc.utils";
import { Message } from "discord.js";

const baseWrongMessageReply = (commandName: string) =>
  `Give me correct command - example: ${process.env.COMMANDS_PREFIX}${commandName} https://suno.com/song/04db00ab-f7d7-40f8-a584-124b096beb31`;

export const playCommand = async (
  message: Message,
  commandData: CommandsType
) => {
  const songUrlOrName = removeCommandNameFromMessage(
    message.content,
    commandData
  );
  let songToPlayName = "";

  if (!songUrlOrName)
    return message.reply("Add either the URL or the name of the song.");
  else if (!songUrlOrName.includes("https://suno.com/song/"))
    songToPlayName = findByName(message, songUrlOrName) || "";
  else {
    const songId = songUrlOrName.split("/").at(-1);

    if (!songId) {
      return message.reply(baseWrongMessageReply(commandData.name));
    }

    const { message: downloadMessage, fileName } = await downloadMP3(
      songUrlOrName,
      MUSIC_FOLDER
    );
    if (!fileName) return message.reply(downloadMessage);
    songToPlayName = fileName;
  }

  const channel = message.member?.voice.channel;
  if (!channel) {
    return message.reply("You need to join a voice channel first!");
  }

  PlayerQueue.setConnection(channel).then(() => {
    PlayerQueue.enqueue(
      { name: songToPlayName, requester: message.author.id },
      { resume: true, message }
    );
  });
  if (songToPlayName) return message.reply(`Added ${songToPlayName}`);
};

const findByName = (message: Message, songName: string): string | null => {
  const files = getMp3FromMusicFolder();
  const foundName = files.find((name) => {
    return name.toLowerCase().includes(songName.trim().toLowerCase());
  });
  if (!foundName) {
    message.reply("No song with your search");
    return null;
  }

  return foundName;
};
