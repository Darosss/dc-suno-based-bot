import {
  ButtonInteraction,
  GuildMember,
  Message,
  SlashCommandBuilder
} from "discord.js";
import { COMMANDS } from "./commands-list";
import {
  ComponentInteractionName,
  componentInteractionSeparator,
  createSongYTChooseEmbed,
  handleBotConnectionToVoiceChannel,
  removeCommandNameFromMessage
} from "@/utils/dc.utils";
import ytdl, { getInfo } from "@distube/ytdl-core";
import ConfigsHandler from "@/utils/configs.utils";
import DownloadMp3Handler from "@/utils/download-logic.utils";
import { MUSIC_FOLDER } from "@/src/globals";
import {
  BaseExecuteOptions,
  MessageCommandType,
  MessageInteractionTypes,
  SongYTBaseData
} from "@/src/types";
import yts from "yt-search";
import PlayerQueue from "@/src/player-queue";

const COMMAND_DATA = COMMANDS["yt play"];
const BUTTON_CUSTOM_ID_PREFIX = ComponentInteractionName.YT_PLAY;
const SLASH_COMMAND_OPTION_SONG_URL = "song-url-or-name";
export const YOUTUBE_LINK = "https://www.youtube.com/";

const playYtCommand = async (message: Message) => {
  const songUrl = removeCommandNameFromMessage(message.content, COMMAND_DATA);
  if (!songUrl || !songUrl.includes(YOUTUBE_LINK)) {
    const data = await getYoutubeSearchByName(songUrl);

    if (!data)
      return await message.reply("Sorry. Not found what you looking for.");

    return await message.reply({
      embeds: [data.embed],
      components: [data.buttons]
    });
  }

  const messageToSend = await playYtCommandLogic(songUrl, message);
  return await message.reply(messageToSend);
};

const getYoutubeSearchByName = async (name: string, count = 5) => {
  const r = await yts(name);

  const videos = r.videos
    .filter((video) => {
      const configs = ConfigsHandler.getConfigs();
      return (
        video.duration.seconds <= configs.ytPlayerMaxSongDuration &&
        video.views >= configs.ytPlayerMinViews
      );
    })
    .slice(0, count)
    .map<SongYTBaseData>((video) => ({ name: video.title, id: video.videoId }));

  return videos.length > 0 ? createSongYTChooseEmbed(videos) : null;
};

const slashPlayYtCommand = async (message: MessageInteractionTypes) => {
  const songUrl = message.options.get(SLASH_COMMAND_OPTION_SONG_URL)
    ?.value as string;

  if (!songUrl || !songUrl.includes(YOUTUBE_LINK)) {
    const data = await getYoutubeSearchByName(songUrl);

    if (!data)
      return await message.reply("Sorry. Not found what you looking for.");

    return await message.reply({
      embeds: [data.embed],
      components: [data.buttons]
    });
  }

  await message.reply("Trying to add your songs");

  const returnMessage = await playYtCommandLogic(songUrl, message);
  return await message.editReply(returnMessage);
};

export const playYtCommandLogic = async (
  songUrl: string,
  message: MessageCommandType | ButtonInteraction
) => {
  const { success, message: messageInfo } =
    handleBotConnectionToVoiceChannel(message);
  if (!success) return messageInfo || "Something went wrong";

  const configs = ConfigsHandler.getConfigs();

  try {
    const stream = ytdl(songUrl, { filter: "audioonly" });

    const info = await getInfo(songUrl);

    const videoDetails = info.videoDetails;
    if (Number(videoDetails.lengthSeconds) > configs.ytPlayerMaxSongDuration) {
      return `The song is too long. Your song: \`${videoDetails.lengthSeconds}\` Max duration(in seconds): \`${configs.ytPlayerMaxSongDuration}\``;
    } else if (Number(videoDetails.viewCount) < configs.ytPlayerMinViews) {
      return `The song has lower views than expected. Your song: \`${videoDetails.viewCount}\` Min views: \`${configs.ytPlayerMinViews}\``;
    }

    const songToPlayData = await DownloadMp3Handler.downloadYtMp3(
      stream,
      videoDetails,
      MUSIC_FOLDER
    );
    if (!songToPlayData) return "Something went wrong. No song at all";

    const messageMemberGuildMember = message.member as GuildMember;
    PlayerQueue.enqueue(
      { songData: songToPlayData, requester: messageMemberGuildMember.id },
      { resume: true }
    );
    return `Added ${songToPlayData.name}`;
  } catch (err) {
    console.error(err);
    return "Couldn't get your song - sorry";
  }
};

const executeAsButton = async (interaction: ButtonInteraction) => {
  const message = await playYtCommandLogic(
    `${YOUTUBE_LINK}watch?v=${interaction.customId.split(componentInteractionSeparator).at(-1)}`,
    interaction
  );
  return await interaction.reply(message);
};

const data = new SlashCommandBuilder()
  .setName(COMMAND_DATA.name.replaceAll(" ", "-"))
  .setDescription(COMMAND_DATA.description)
  .addStringOption((option) =>
    option
      .setName(SLASH_COMMAND_OPTION_SONG_URL)
      .setDescription("Provide song url or search name")
  );

const executeOpts: BaseExecuteOptions = {
  needsToBeInSameVoiceChannel: true
};
export {
  data,
  slashPlayYtCommand as execute,
  COMMAND_DATA as command,
  playYtCommand as executeAsText,
  BUTTON_CUSTOM_ID_PREFIX as buttonInterractionCustomIdPrefix,
  executeAsButton,
  executeOpts
};
