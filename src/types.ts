import {
  ChatInputCommandInteraction,
  Client,
  Collection,
  Message,
  MessageContextMenuCommandInteraction,
  SlashCommandBuilder,
  UserContextMenuCommandInteraction
} from "discord.js";
import { CommandsType } from "./commands/commands-list";
import { AudioResource } from "@discordjs/voice";

export type TODO = any;

type CommandExecuteAsText = (message: Message) => unknown;

type SlashCommandExecute = (message: MessageInteractionTypes) => unknown;

type ClientTextCommandCollectionData = {
  execute: CommandExecuteAsText;
  needsToBeInSameVoiceChannel?: boolean;
};
type ClientSlashCommandCollectionData = {
  execute: SlashCommandExecute;
  needsToBeInSameVoiceChannel?: boolean;
};

export type ClientWithCommands = Client & {
  commands: Collection<string, ClientSlashCommandCollectionData>;
  textCommands: Collection<string, ClientTextCommandCollectionData>;
};

export type BaseCommandReturnType = {
  data: SlashCommandBuilder;
  execute: SlashCommandExecute;
  command: CommandsType;
  executeAsText: CommandExecuteAsText;
  needsToBeInSameVoiceChannel?: boolean;
};

export type MessageInteractionTypes =
  | ChatInputCommandInteraction
  | MessageContextMenuCommandInteraction
  | UserContextMenuCommandInteraction;

export type MessageCommandType = Message | MessageInteractionTypes;

export type PlayerQueueItemType = {
  name: string;
  requester: string;
};

export type CurrentSongType = PlayerQueueItemType & {
  duration: number;
  resource: Pick<AudioResource, "playbackDuration">;
};
