import { downloadMP3 } from "@/src/download-logic";
import { COMMANDS } from "./commands-list";
import PlayerQueue from "@/src/player-queue";
import { getMp3FromMusicFolder } from "@/utils/mp3.utils";
import { MUSIC_FOLDER } from "@/src/globals";
import { removeCommandNameFromMessage } from "@/utils/dc.utils";
import { GuildMember, Message, SlashCommandBuilder } from "discord.js";
import { MessageCommandType, MessageInteractionTypes } from "../types";

type FindByNameReturnType = {
  message: string;
  fileName?: string;
};

const COMMAND_DATA = COMMANDS.play;
const SLASH_COMMAND_OPTION_SONG_ULR_NAME = "song-url-or-name";
const baseWrongMessageReply = `Give me correct command - example: ${process.env.COMMANDS_PREFIX}${COMMAND_DATA.name} https://suno.com/song/04db00ab-f7d7-40f8-a584-124b096beb31`;

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
  let songToPlayName = "";
  if (!songUrlOrName) return "Add either the URL or the name of the song.";
  else if (!songUrlOrName.includes("https://suno.com/song/")) {
    const findByNameData = findByName(songUrlOrName);
    if (!findByNameData.fileName) return findByNameData.message;

    songToPlayName = findByNameData.fileName;
  } else {
    const songId = songUrlOrName.split("/").at(-1);

    if (!songId) {
      return baseWrongMessageReply;
    }

    const { message: downloadMessage, fileName } = await downloadMP3(
      songUrlOrName,
      MUSIC_FOLDER
    );
    if (!fileName) return downloadMessage;
    songToPlayName = fileName;
  }
  const messageMemberGuildMember = message.member as GuildMember;
  const channel = messageMemberGuildMember?.voice.channel;
  if (!channel) {
    return "You need to join a voice channel first!";
  }
  if (songToPlayName) {
    PlayerQueue.setConnection(channel).then(() => {
      PlayerQueue.enqueue(
        { name: songToPlayName, requester: messageMemberGuildMember.id },
        { resume: true }
      );
    });
    return `Added ${songToPlayName}`;
  } else {
    return "Something wen't wrong ";
  }
};

const findByName = (songName: string): FindByNameReturnType => {
  const files = getMp3FromMusicFolder();
  const foundName = files.find((name) =>
    name.toLowerCase().includes(songName.trim().toLowerCase())
  );
  if (!foundName) {
    return {
      message: "No song with your search"
    };
  }

  return { fileName: foundName, message: "Found song" };
};

const data = new SlashCommandBuilder()
  .setName(COMMAND_DATA.name)
  .addStringOption((option) =>
    option
      .setName(SLASH_COMMAND_OPTION_SONG_ULR_NAME)
      .setDescription("Provide songs url/name")
  )
  .setDescription(COMMAND_DATA.description);

const needsToBeInSameVoiceChannel = true;

export {
  data,
  slashPlayCommand as execute,
  COMMAND_DATA as command,
  playCommand as executeAsText,
  needsToBeInSameVoiceChannel
};
