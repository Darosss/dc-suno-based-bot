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

export type TODO = any;

type CommandExecuteAsText = (message: Message) => unknown;

type ClientTextCommandCollectionData = {
  execute: CommandExecuteAsText;
  needsToBeInSameVoiceChannel?: boolean;
};

export type ClientWithCommands = Client & {
  commands: Collection<string, any>;
  textCommands: Collection<string, ClientTextCommandCollectionData>;
};

export type BaseCommandReturnType = {
  data: SlashCommandBuilder;
  execute: unknown;
  command: CommandsType;
  executeAsText: CommandExecuteAsText;
  needsToBeInSameVoiceChannel?: boolean;
};

export type MessageInteractionTypes =
  | ChatInputCommandInteraction
  | MessageContextMenuCommandInteraction
  | UserContextMenuCommandInteraction;

export type MessageCommandType = Message | MessageInteractionTypes;
