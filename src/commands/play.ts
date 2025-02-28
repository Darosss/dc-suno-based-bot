import DownloadMp3Handler from "@/utils/download-logic.utils";
import { COMMANDS } from "./commands-list";
import PlayerQueue from "@/src/player-queue";
import {
  getAllPossibleAudios,
  getStoredSongDataFromFileName
} from "@/utils/mp3.utils";
import {
  handleBotConnectionToVoiceChannel,
  removeCommandNameFromMessage
} from "@/utils/dc.utils";
import { GuildMember, Message, SlashCommandBuilder } from "discord.js";
import { isSunoSong } from "@/utils/suno.utils";

import {
  BaseExecuteOptions,
  MessageCommandType,
  MessageInteractionTypes,
  StoredSongData
} from "@/src/types";
import { isFileAccesilbe } from "../utils/files.utils";
import { MUSIC_FOLDER } from "../globals";
import path from "path";

type FindByNameReturnType = {
  message: string;
  songData?: StoredSongData;
};

const COMMAND_DATA = COMMANDS.play;
const SLASH_COMMAND_OPTION_SONG_ULR_NAME = "song-url-or-name";
const baseWrongMessageReply = `Give me correct command - example: ${process.env.COMMANDS_PREFIX}${COMMAND_DATA.name} https://suno.com/song/<SONG_ID>`;

const playCommand = async (message: Message) => {
  const songUrlOrName = removeCommandNameFromMessage(
    message.content,
    COMMAND_DATA
  );

  const messageToSend = await playCommandLogic(songUrlOrName, message);

  return await message.reply(messageToSend);
};

const slashPlayCommand = async (message: MessageInteractionTypes) => {
  const songUrlOrName = message.options.get(
    SLASH_COMMAND_OPTION_SONG_ULR_NAME
  )?.value;
  if (!songUrlOrName)
    return await message.reply("No songs url / name provided :(");

  await message.reply("Trying to add your songs");

  const returnMessage = await playCommandLogic(
    songUrlOrName as string,
    message
  );
  return await message.editReply(returnMessage);
};

const playCommandLogic = async (
  songUrlOrName: string,
  message: MessageCommandType
): Promise<string> => {
  let songToPlayData: StoredSongData | null = null;
  let isCurrentSongDownloaded = false;
  const { success, message: messageInfo } =
    handleBotConnectionToVoiceChannel(message);
  if (!success) return messageInfo || "Something went wrong";
  else if (!songUrlOrName) return "Add either the URL or the name of the song.";

  if (!isSunoSong(songUrlOrName)) {
    //if not /song/ suno/ find by name
    const findByNameData = await findByName(songUrlOrName);
    if (!findByNameData.songData) return findByNameData.message;

    songToPlayData = findByNameData.songData;
    console.log(findByNameData.songData.fileName, "jaki path?");
    if (
      await isFileAccesilbe(
        path.join(MUSIC_FOLDER, findByNameData.songData.fileName)
      )
    )
      isCurrentSongDownloaded = true;
  }

  if (!isCurrentSongDownloaded) {
    const songId = songToPlayData?.id || songUrlOrName.split("/").at(-1);
    if (!songId) {
      return baseWrongMessageReply;
    }

    const { message: downloadMessage, fileData } =
      await DownloadMp3Handler.downloadSunoMP3(songId);
    if (!fileData) return downloadMessage;
    songToPlayData = fileData;
  }

  if (!songToPlayData) return "Something went wrong. No song at all";

  const messageMemberGuildMember = message.member as GuildMember;

  PlayerQueue.enqueue(
    { songData: songToPlayData, requester: messageMemberGuildMember.id },
    { resume: true }
  );
  return `Added ${songToPlayData.name}`;
};

const findByName = async (songName: string): Promise<FindByNameReturnType> => {
  const possibleAudios = (await getAllPossibleAudios()).split("\n");

  const foundName = possibleAudios.find((songData) =>
    songData.toLowerCase().includes(songName.trim().toLowerCase())
  );

  if (!foundName) {
    return {
      message: "No song with your search"
    };
  }

  return {
    songData: getStoredSongDataFromFileName(foundName),
    message: "Found song"
  };
};

const data = new SlashCommandBuilder()
  .setName(COMMAND_DATA.name)
  .addStringOption((option) =>
    option
      .setName(SLASH_COMMAND_OPTION_SONG_ULR_NAME)
      .setDescription("Provide songs url/name")
  )
  .setDescription(COMMAND_DATA.description);

const executeOpts: BaseExecuteOptions = {
  needsToBeInSameVoiceChannel: true
};
export {
  data,
  slashPlayCommand as execute,
  COMMAND_DATA as command,
  playCommand as executeAsText,
  executeOpts
};
