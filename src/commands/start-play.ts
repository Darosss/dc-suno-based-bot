import PlayerQueue from "@/src/player-queue";
import { getMp3FromMusicFolder } from "@/utils/mp3.utils";
import { GuildMember, Message, SlashCommandBuilder } from "discord.js";
import { COMMANDS } from "./commands-list";
import { DEFAULT_MAX_RADIO_SONGS } from "@/src/globals";
import { removeCommandNameFromMessage } from "../utils/dc.utils";
import { MessageCommandType, MessageInteractionTypes } from "../types";

const SLASH_COMMAND_OPTION_SONG_COUNT = "songs-count";
const COMMAND_DATA = COMMANDS.radio;

const startPlayCommand = (message: Message) => {
  if (message.member?.id !== process.env.OWNER_ID)
    return message.reply("Only owner can do this (for now) ");

  const numberOfSongs =
    Number(removeCommandNameFromMessage(message.content, COMMAND_DATA)) ||
    DEFAULT_MAX_RADIO_SONGS;

  const returnMessage = startPlayCommandLogic(message, numberOfSongs);

  return message.reply(returnMessage);
};

const slashStartPlayCommand = async (message: MessageInteractionTypes) => {
  if (message.user.id !== process.env.OWNER_ID)
    return message.reply("Only owner can do this (for now) ");
  const songsCount = message.options.get(
    SLASH_COMMAND_OPTION_SONG_COUNT
  )?.value;

  await message.reply("Trying to set radio on");
  const returnMessage = startPlayCommandLogic(
    message,
    (songsCount as number) || DEFAULT_MAX_RADIO_SONGS
  );
  return await message.editReply(returnMessage);
};

const startPlayCommandLogic = (
  message: MessageCommandType,
  numberOfSongs: number
): string => {
  const files = getMp3FromMusicFolder().sort(() => 0.5 - Math.random());

  const maxSongs =
    numberOfSongs > DEFAULT_MAX_RADIO_SONGS
      ? DEFAULT_MAX_RADIO_SONGS
      : DEFAULT_MAX_RADIO_SONGS > files.length
        ? files.length
        : numberOfSongs;

  const messageMemberGuildMember = message.member as GuildMember;

  for (let songIndex = 0; songIndex < maxSongs; songIndex++) {
    PlayerQueue.enqueue({
      name: files[songIndex],
      requester: messageMemberGuildMember.id
    });
  }

  if (files.length === 0) {
    return "No music files found in the /music folder.";
  }

  const channel = messageMemberGuildMember.voice.channel;
  if (!channel) {
    return "You need to join a voice channel first!";
  }

  PlayerQueue.setConnection(channel).then(() => {
    PlayerQueue.start(message);
  });

  return `Loaded ${maxSongs} songs`;
};

const data = new SlashCommandBuilder()
  .setName(COMMAND_DATA.name)
  .addNumberOption((option) =>
    option
      .setName(SLASH_COMMAND_OPTION_SONG_COUNT)
      .setDescription("Set count of radio songs")
      .setMaxValue(DEFAULT_MAX_RADIO_SONGS)
      .setMinValue(2)
  )
  .setDescription(COMMAND_DATA.description)
  .setDefaultMemberPermissions("0");

const needsToBeInSameVoiceChannel = true;

export {
  data,
  slashStartPlayCommand as execute,
  COMMAND_DATA as command,
  startPlayCommand as executeAsText,
  needsToBeInSameVoiceChannel
};
