import { CommandsType } from "@/src/commands/commands-list";
import { client } from "../init-bot";
import { ChannelType, Message } from "discord.js";

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
