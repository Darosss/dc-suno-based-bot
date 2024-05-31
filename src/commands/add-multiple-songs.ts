import { downloadMP3 } from "../download-logic";
import { CommandsType } from "./commands-list";
import { MUSIC_FOLDER } from "../globals";
import { Message } from "discord.js";

const MAX_SONGS = 5;

const baseWrongMessageReply = (
  commandName: string
) => `_Give me correct songs urls with ids each separated by [;] (semicolon)_
- example: 
\`${process.env.COMMANDS_PREFIX}${commandName} https://suno.com/song/04db00ab-f7d7-40f8-a584-124b096beb31;https://suno.com/song/f1d5aad1-ec23-42e7-9e47-2617ea2de69a`;

export const addMultipleSongs = async (
  message: Message,
  commandData: CommandsType
) => {
  const messageSplited = message.content.split(commandData.name);

  const songsUrls = messageSplited.at(-1);

  if (!songsUrls || songsUrls.length <= 0) {
    return message.reply(baseWrongMessageReply(commandData.name));
  } else {
    const songsUrlSplittedUnique = Array.from(
      new Set(songsUrls.split(";"))
    ).filter((url) => url.includes("https://suno.com/song/"));
    if (songsUrlSplittedUnique.length >= MAX_SONGS) {
      return message.reply(`No more than ${MAX_SONGS} songs`);
    }

    const messagesToSend = [`<@${message.member?.id}>`];
    for await (const songUrl of songsUrlSplittedUnique) {
      const { message: downloadMessage } = await downloadMP3(
        songUrl.trim(),
        MUSIC_FOLDER
      );
      messagesToSend.push(downloadMessage);
    }

    return message.reply(messagesToSend.join("\n"));
  }
};
