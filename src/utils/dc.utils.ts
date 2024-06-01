import { CommandsType } from "@/src/commands/commands-list";
import { client } from "../init-bot";
import { ChannelType, EmbedBuilder, Interaction, Message } from "discord.js";
import { CurrentSongType, PlayerQueueItemType } from "../types";

export const removeCommandNameFromMessage = (
  message: string,
  command: CommandsType
) =>
  message
    .slice(process.env.COMMANDS_PREFIX.length + command.name.length)
    .trim();

export const canUserUseCommands = (message: Message) => {
  if (client.voice.adapters.size === 0) return true;

  const canUse = message.guild?.channels.cache.some((channel) => {
    if (!client.user || !message.member) return;
    if (
      channel.type === ChannelType.GuildVoice &&
      channel.members.has(client.user.id) &&
      channel.members.has(message.member.id)
    )
      return true;
  });

  if (!canUse) message.reply("You are not in the same voice channel as me");
  return canUse;
};

export const isDcMessage = (pet: Message | Interaction): pet is Message => {
  return (pet as Message).author !== undefined;
};

export const createSongEmbed = (
  data: CurrentSongType | null,
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
    process.env.BOT_COMMANDS_CHANNEL_ID
  );

  if (commandsChannel?.isTextBased()) return commandsChannel;
  else console.error("Provided commands channel is not text based");
};
