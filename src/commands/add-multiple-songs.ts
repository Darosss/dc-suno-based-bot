import DownloadMp3Handler from "@/utils/download-logic.utils";
import { COMMANDS } from "./commands-list";
import { Message, SlashCommandBuilder } from "discord.js";
import { BaseExecuteOptions, MessageInteractionTypes } from "../types";
import { removeCommandNameFromMessage } from "@/utils/dc.utils";
import ConfigsHandler from "@/src/utils/configs.utils";
import { isSunoSong } from "../utils/suno.utils";

const COMMAND_DATA = COMMANDS["add many songs"];
const SLASH_COMMAND_OPTION_SONG_URLS = "songs-urls";

const baseWrongMessageReply = `_Give me correct songs urls with ids each separated by [;] (semicolon)_
- example: 
\`${process.env.COMMANDS_PREFIX}${COMMAND_DATA.name} https://suno.com/song/<SONG_ID>;https://suno.com/song/<SONG_ID>`;

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
  const songsUrlSplittedUnique = Array.from(new Set(songsUrls.split(";")))
    .map((url) => {
      console.log(url, "-> ", isSunoSong(url));
      if (isSunoSong(url)) return url.split("/").at(-1)!;
      else return "";
    })
    .filter(Boolean);

  const maxSongs = ConfigsHandler.getConfigs().addMultipleSongsMaxCount;
  if (songsUrlSplittedUnique.length > maxSongs) {
    return `No more than ${maxSongs} songs`;
  }

  const messagesToSend = [];
  for await (const songUrl of songsUrlSplittedUnique) {
    const { message: downloadMessage } =
      await DownloadMp3Handler.downloadSunoMP3(songUrl.trim());
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

const executeOpts: BaseExecuteOptions = {
  needsToBeInSameVoiceChannel: true
};

export {
  data,
  slashCommandAddMultipleSongs as execute,
  COMMAND_DATA as command,
  addMultipleSongs as executeAsText,
  executeOpts
};
