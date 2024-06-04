import PlayerQueue from "@/src/player-queue";
import { GuildMember, Message, SlashCommandBuilder } from "discord.js";
import { COMMANDS } from "./commands-list";
import { removeCommandNameFromMessage } from "@/utils/dc.utils";
import ytdl, { getInfo } from "ytdl-core";
import ConfigsHandler from "@/utils/configs.utils";
import { downloadYtMp3 } from "@/src/download-logic";
import { MUSIC_FOLDER } from "@/src/globals";
import { MessageInteractionTypes } from "@/src/types";

const COMMAND_DATA = COMMANDS["yt play"];
const SLASH_COMMAND_OPTION_SONG_URL = "song-url";
const YOUTUBE_LINK = "https://www.youtube.com/";
const WRONG_URL_MESSAGE = "You need to provide correct song url";

const playYtCommand = async (message: Message) => {
  const songUrl = removeCommandNameFromMessage(message.content, COMMAND_DATA);
  if (!songUrl || !songUrl.includes(YOUTUBE_LINK))
    return await message.reply(WRONG_URL_MESSAGE);

  const messageToSend = await playYtCommandLogic(songUrl, message.member);
  return await message.reply(messageToSend);
};

const slashPlayYtCommand = async (message: MessageInteractionTypes) => {
  const songUrl = message.options.get(SLASH_COMMAND_OPTION_SONG_URL)
    ?.value as string;

  if (!songUrl || !songUrl.includes(YOUTUBE_LINK))
    return await message.reply(WRONG_URL_MESSAGE);

  await message.reply("Trying to add your songs");

  const returnMessage = await playYtCommandLogic(
    songUrl,
    message.member as GuildMember
  );
  return await message.editReply(returnMessage);
};

const playYtCommandLogic = async (
  songUrl: string,
  member: GuildMember | null
) => {
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

    const songName = downloadYtMp3(stream, videoDetails, MUSIC_FOLDER);
    const messageMemberGuildMember = member as GuildMember;
    const channel = messageMemberGuildMember?.voice.channel;
    if (!channel) {
      return "You need to join a voice channel first!";
    }
    if (songName) {
      PlayerQueue.setConnection(channel).then(() => {
        console.log("added?");
        PlayerQueue.enqueue(
          {
            name: songName,
            requester: messageMemberGuildMember.id
          },
          { resume: true }
        );
      });
      return `Added ${songName}`;
    } else {
      return "Something went wrong ";
    }
  } catch (err) {
    console.error(err);
    return "Couldn't get your song - sorry";
  }
};

const data = new SlashCommandBuilder()
  .setName(COMMAND_DATA.name.replaceAll(" ", "-"))
  .setDescription(COMMAND_DATA.description)
  .addStringOption((option) =>
    option
      .setName(SLASH_COMMAND_OPTION_SONG_URL)
      .setDescription("Provide song url")
  );

const needsToBeInSameVoiceChannel = true;

export {
  data,
  slashPlayYtCommand as execute,
  COMMAND_DATA as command,
  playYtCommand as executeAsText,
  needsToBeInSameVoiceChannel
};
