import {
  ButtonInteraction,
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
import { ComponentInteractionName } from "./utils/dc.utils";
import { SongNamesAffixesEnum } from "./enums";

export type TODO = any;

type CommandExecuteAsText = (message: Message) => unknown;

type SlashCommandExecute = (message: MessageInteractionTypes) => unknown;

type ButtonInteractionExecute = (interaction: ButtonInteraction) => unknown;

export type BaseExecuteOptions = {
  needsToBeInSameVoiceChannel?: boolean;
  onlyOwner?: boolean;
};

export type CollectionData<ExecuteType> = {
  execute: ExecuteType;
  executeOpts?: BaseExecuteOptions;
};

type ClientTextCommandCollectionData = CollectionData<CommandExecuteAsText>;
type ClientSlashCommandCollectionData = CollectionData<SlashCommandExecute>;
type ClientButtonInteractionCollectionData =
  CollectionData<ButtonInteractionExecute>;

export type ClientWithCommands = Client & {
  commands: Collection<string, ClientSlashCommandCollectionData>;
  textCommands: Collection<string, ClientTextCommandCollectionData>;
  buttonInteractions: Collection<string, ClientButtonInteractionCollectionData>;
};

export type BaseCommandReturnType = {
  data: SlashCommandBuilder;
  execute: SlashCommandExecute;
  command: CommandsType;
  executeAsText: CommandExecuteAsText;
  executeOpts?: BaseExecuteOptions;
};

export type BaseButtonInteractionReturnType = BaseCommandReturnType & {
  executeAsButton: ButtonInteractionExecute;
  buttonInterractionCustomIdPrefix: ComponentInteractionName;
};

export type MessageInteractionTypes =
  | ChatInputCommandInteraction
  | MessageContextMenuCommandInteraction
  | UserContextMenuCommandInteraction;

export type MessageCommandType = Message | MessageInteractionTypes;

export type PlayerQueueItemType = {
  songData: StoredSongData;
  requester: string;
};

export type CurrentSongType = PlayerQueueItemType & {
  duration: number;
  resource: Pick<AudioResource, "playbackDuration">;
};

export type SongYTBaseData = {
  name: string;
  id: string;
};

export type StoredSongData = {
  fileName: string;
  name: string;
  id: string;
  site: SongNamesAffixesEnum;
};
