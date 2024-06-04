import { downloadMP3 } from "../download-logic";
import { COMMANDS } from "./commands-list";
import { MUSIC_FOLDER } from "../globals";
import { Message, SlashCommandBuilder } from "discord.js";
import { MessageInteractionTypes } from "../types";
import { removeCommandNameFromMessage } from "../utils/dc.utils";
import ConfigsHandler from "@/src/utils/configs.utils";

const COMMAND_DATA = COMMANDS["add many songs"];
const SLASH_COMMAND_OPTION_SONG_URLS = "songs-urls";

const baseWrongMessageReply = `_Give me correct songs urls with ids each separated by [;] (semicolon)_
- example: 
\`${process.env.COMMANDS_PREFIX}${COMMAND_DATA.name} https://suno.com/song/04db00ab-f7d7-40f8-a584-124b096beb31;https://suno.com/song/f1d5aad1-ec23-42e7-9e47-2617ea2de69a`;

const addMultipleSongs = async (message: Message) => {
  const songsUrls = removeCommandNameFromMessage(message.content, COMMAND_DATA);

  if (!songsUrls) return await message.reply(baseWrongMessageReply);

  const returnMessage = await addMultipleSongsLogic(songsUrls);

  return await message.reply(returnMessage);
};

const slashCommandAddMultipleSongs = async (
  message: MessageInteractionTypes
) => {
  const songsUrls = message.options.get(SLASH_COMMAND_OPTION_SONG_URLS)?.value;
  if (!songsUrls) return await message.reply("No songs urls provided :(");

  await message.reply("Trying to add your songs");
  const returnMessage = await addMultipleSongsLogic(songsUrls as string);
  return await message.editReply(returnMessage);
};

const addMultipleSongsLogic = async (songsUrls: string): Promise<string> => {
  console.log(songsUrls);
  const songsUrlSplittedUnique = Array.from(
    new Set(songsUrls.split(";"))
  ).filter((url) => url.includes("https://suno.com/song/"));
  const maxSongs = ConfigsHandler.getConfigs().addMultipleSongsMaxCount;
  if (songsUrlSplittedUnique.length > maxSongs) {
    return `No more than ${maxSongs} songs`;
  }

  console.log(songsUrlSplittedUnique, "eee");

  const messagesToSend = [];
  for await (const songUrl of songsUrlSplittedUnique) {
    const { message: downloadMessage } = await downloadMP3(
      songUrl.trim(),
      MUSIC_FOLDER
    );
    messagesToSend.push(downloadMessage);
  }

  return messagesToSend.join("\n") || "No correct songs provided";
};

const data = new SlashCommandBuilder()
  .setName(COMMAND_DATA.name.replaceAll(" ", "-"))
  .addStringOption((option) =>
    option
      .setName(SLASH_COMMAND_OPTION_SONG_URLS)
      .setDescription("Provide songs urls all separated by [;] semicolon")
  )
  .setDescription(COMMAND_DATA.description);

const needsToBeInSameVoiceChannel = true;

export {
  data,
  slashCommandAddMultipleSongs as execute,
  COMMAND_DATA as command,
  addMultipleSongs as executeAsText,
  needsToBeInSameVoiceChannel
};
