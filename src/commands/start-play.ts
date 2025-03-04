import PlayerQueue from "@/src/player-queue";
import {
  getAllPossibleAudios,
  getMp3FromMusicFolder,
  getStoredSongDataFromFileName
} from "@/utils/mp3.utils";
import { GuildMember, Message, SlashCommandBuilder } from "discord.js";
import { COMMANDS } from "./commands-list";
import {
  handleBotConnectionToVoiceChannel,
  removeCommandNameFromMessage
} from "@/src/utils/dc.utils";
import {
  BaseExecuteOptions,
  MessageCommandType,
  MessageInteractionTypes,
  StoredSongData
} from "@/src/types";
import ConfigsHandler from "@/src/utils/configs.utils";

const SLASH_COMMAND_OPTION_SONG_COUNT = "songs-count";
const SLASH_COMMAND_OPTION_SONG_TYPE = "only-downloaded";
const COMMAND_DATA = COMMANDS.radio;

const startPlayCommand = async (message: Message) => {
  const numberOfSongs =
    Number(removeCommandNameFromMessage(message.content, COMMAND_DATA)) ||
    ConfigsHandler.getConfigs().maxRadioSongs;

  const returnMessage = await startPlayCommandLogic(message, numberOfSongs);

  return message.reply(returnMessage);
};

const slashStartPlayCommand = async (message: MessageInteractionTypes) => {
  const songsCount = message.options.get(
    SLASH_COMMAND_OPTION_SONG_COUNT
  )?.value;
  const onlyDownloaded = !!message.options.get(SLASH_COMMAND_OPTION_SONG_TYPE)
    ?.value;

  await message.reply("Trying to set radio on");
  const returnMessage = await startPlayCommandLogic(
    message,
    (songsCount as number) || ConfigsHandler.getConfigs().maxRadioSongs,
    onlyDownloaded
  );
  return await message.editReply(returnMessage);
};

const getRadioSongsHelper = async (onlyDownloaded?: boolean) => {
  if (onlyDownloaded) {
    return (await getMp3FromMusicFolder()).sort(() => 0.5 - Math.random());
  } else {
    const allPossibleAudios = (await getAllPossibleAudios())
      .split("\n")
      .sort(() => 0.5 - Math.random())
      .filter(Boolean);

    return allPossibleAudios.map((fileName) =>
      getStoredSongDataFromFileName(fileName)
    );
  }
};

const startPlayCommandLogic = async (
  message: MessageCommandType,
  numberOfSongs: number,
  onlyDownloaded?: boolean
): Promise<string> => {
  const { success, message: messageInfo } =
    handleBotConnectionToVoiceChannel(message);
  if (!success) return messageInfo || "Something went wrong";

  const files = await getRadioSongsHelper(onlyDownloaded);
  const maxRadioSongs = ConfigsHandler.getConfigs().maxRadioSongs;
  const maxSongs =
    numberOfSongs > maxRadioSongs
      ? maxRadioSongs
      : maxRadioSongs > files.length
        ? files.length
        : numberOfSongs;

  const messageMemberGuildMember = message.member as GuildMember;

  for (let songIndex = 0; songIndex < maxSongs; songIndex++) {
    PlayerQueue.enqueue({
      songData: files[songIndex],
      requester: messageMemberGuildMember.id
    });
  }

  if (files.length === 0) {
    return "No music files found in the /music folder.";
  }

  PlayerQueue.start();
  return `Loaded ${maxSongs} songs`;
};

const data = new SlashCommandBuilder()
  .setName(COMMAND_DATA.name)
  .addNumberOption((option) =>
    option
      .setName(SLASH_COMMAND_OPTION_SONG_COUNT)
      .setDescription("Set count of radio songs")
      .setMaxValue(ConfigsHandler.getConfigs().maxRadioSongs)
      .setMinValue(2)
  )
  .addBooleanOption((option) =>
    option
      .setName(SLASH_COMMAND_OPTION_SONG_TYPE)
      .setDescription("Only already downloaded?")
  )
  .setDescription(COMMAND_DATA.description)
  .setDefaultMemberPermissions("0");

const executeOpts: BaseExecuteOptions = {
  needsToBeInSameVoiceChannel: true,
  onlyOwner: true
};
export {
  data,
  slashStartPlayCommand as execute,
  COMMAND_DATA as command,
  startPlayCommand as executeAsText,
  executeOpts
};
