import { CommandsType } from "@/src/commands/commands-list";
import { client } from "../init-bot";
import {
  ChannelType,
  EmbedBuilder,
  GuildMember,
  Interaction,
  Message,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";
import {
  CollectionData,
  CurrentSongType,
  MessageCommandType,
  PlayerQueueItemType,
  SongYTBaseData
} from "../types";
import ConfigsHandler from "@/utils/configs.utils";

export const componentInteractionSeparator = ":";

export type CheckExecuteOptionsReturnType = {
  canExecute: boolean;
  message?: string;
};

export enum ComponentInteractionName {
  YT_PLAY = `yt-play`
}

export const removeCommandNameFromMessage = (
  message: string,
  command: CommandsType
) =>
  message
    .slice(process.env.COMMANDS_PREFIX.length + command.name.length)
    .trim();

export const isBotAndUserInSameChannel = (message: MessageCommandType) => {
  if (client.voice.adapters.size === 0) return true;

  const canUse = message.guild?.channels.cache.some((channel) => {
    if (!client.user || !message.member) return;
    const messageMemberGuild = message.member as GuildMember;
    if (
      channel.type === ChannelType.GuildVoice &&
      channel.members.has(client.user.id) &&
      channel.members.has(messageMemberGuild.id)
    )
      return true;
  });

  return canUse;
};

export const isDcMessage = (
  message: Message | Interaction
): message is Message => {
  return (message as Message).author !== undefined;
};

export const createSongEmbed = (
  data: CurrentSongType | null,
  repeat: boolean,
  nextSongData: PlayerQueueItemType | void
) => {
  const { duration, resource, name, requester } = data || {
    currentTime: 0,
    duration: 0,
    name: "-",
    requester: "",
    resource: { playbackDuration: 0 }
  };

  const embed = new EmbedBuilder()
    .setTitle("Now Playing")
    .addFields(
      { name: "Name", value: `${name}`, inline: true },
      {
        name: "Requested by",
        value: requester ? `<@${requester}>` : "-",
        inline: false
      },
      {
        name: "Next",
        value: nextSongData
          ? `${nextSongData.name} by <@${nextSongData.requester}>`
          : "-",
        inline: true
      },
      {
        name: "Repeat playlist",
        value: repeat ? "On" : "Off"
      },
      {
        name: "Progress",
        value: `${formatTime(resource?.playbackDuration)} / ${formatTime(duration)}`,
        inline: false
      }
    )
    .setColor("DarkBlue");

  return embed;
};

const formatTime = (miliseconds: number) => {
  const minutes = Math.floor(miliseconds / 1000 / 60);
  const secs = Math.floor((miliseconds / 1000) % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
};
export const getBotCommandsChannel = () => {
  const commandsChannel = client.channels.cache.get(
    ConfigsHandler.getConfigs().botComandsChannelId ||
      process.env.BOT_COMMANDS_CHANNEL_ID
  );

  if (commandsChannel?.isTextBased()) return commandsChannel;
  else console.error("Provided commands channel is not text based");
};

export const createSongYTChooseEmbed = (data: SongYTBaseData[]) => {
  const embed = new EmbedBuilder()
    .setTitle("Choose song to play:")
    .setDescription(
      data.map((video, index) => `${index + 1}. ${video.name}`).join("\n")
    );

  const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
    data.map((video, index) =>
      new ButtonBuilder()
        .setCustomId(
          `${ComponentInteractionName.YT_PLAY}${componentInteractionSeparator}${video.id}`
        )
        .setLabel(`${index + 1}`)
        .setStyle(ButtonStyle.Primary)
    )
  );

  return { embed, buttons };
};

const checkIfUserIsInVoiceChannel = (member: GuildMember) => {
  const channel = member.voice.channel;
  if (channel) return true;
};

export const checkExecuteOptions = (
  executeOpts: CollectionData<unknown>["executeOpts"],
  message: MessageCommandType
): CheckExecuteOptionsReturnType => {
  if (!executeOpts) return { canExecute: true };
  else if (
    executeOpts.needsToBeInSameVoiceChannel &&
    !checkIfUserIsInVoiceChannel(message.member as GuildMember)
  ) {
    return {
      canExecute: false,
      message: "You need to join the channel to do that"
    };
  } else if (
    executeOpts.needsToBeInSameVoiceChannel &&
    !isBotAndUserInSameChannel(message)
  ) {
    return {
      canExecute: false,
      message: "You are not in the same voice channel as me"
    };
  } else if (
    executeOpts.onlyOwner &&
    (message.member as GuildMember).id !== process.env.OWNER_ID
  ) {
    return {
      canExecute: false,
      message: "Only owner can do the command. sorry"
    };
  }
  return { canExecute: true };
};
