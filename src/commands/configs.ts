import { Message, SlashCommandBuilder } from "discord.js";
import { COMMANDS } from "./commands-list";

import { MessageInteractionTypes } from "../types";
import { ConfigsType } from "@/utils/configs.utils";
import ConfigsHandler from "@/utils/configs.utils";

const COMMAND_DATA = COMMANDS["edit configs"];

type SlashCommandOptionType = {
  name: string;
  description: string;
};

type SlashCommandOptionsNamesType = {
  [P in keyof ConfigsType]: SlashCommandOptionType;
};

const SLASH_COMMAND_DEFAULT_OPTION_NAME = "set-default";

const SLASH_COMMAND_OPTIONS_NAMES: SlashCommandOptionsNamesType = {
  maxIdleTimeMs: {
    name: "max-idle-time-ms",
    description: "Time in MS when player is in idle and leaves the channel"
  },
  playerStatusUpdateMs: {
    name: "player-status-update-ms",
    description: "Time in MS update current playing song in status channel"
  },
  addMultipleSongsMaxCount: {
    name: "add-multiple-songs-max-count",
    description: "Max count of songs in add multiple songs command"
  },
  maxRadioSongs: {
    name: "max-radio-songs",
    description: "Max songs in radio command"
  },
  ytPlayerMaxSongDuration: {
    name: "yt-player-max-song-duration",
    description: "Max duration for youtube content"
  },
  ytPlayerMinViews: {
    name: "yt-player-min-views",
    description: "Min views for youtube content"
  }
};

const getMessageOfChangedConfigs = (config: Partial<ConfigsType>) =>
  Object.entries(config)
    .filter(([, value]) => value)
    .map(([key, nonNullVal]) => `${key}: ${nonNullVal}`)
    .join("\n");

const configsCommand = (message: Message) => {
  if (message.member?.id !== process.env.OWNER_ID)
    return message.reply("Only owner can do this (for now) ");

  return message.reply(
    "Yoo. Use slash command instead. Not working in text command(for now)"
  );
};

const slashConfigsCommands = async (message: MessageInteractionTypes) => {
  if ("getSubcommand" in message.options) {
    const subcommand = message.options.getSubcommand();
    const configsToUpdate: Partial<ConfigsType> = {};
    if (subcommand === "player") {
      const maxIdleTimeMs = message.options.getNumber(
        SLASH_COMMAND_OPTIONS_NAMES.maxIdleTimeMs.name
      );
      const playerStatusUpdateMs = message.options.getNumber(
        SLASH_COMMAND_OPTIONS_NAMES.playerStatusUpdateMs.name
      );

      maxIdleTimeMs ? (configsToUpdate.maxIdleTimeMs = maxIdleTimeMs) : null;
      playerStatusUpdateMs
        ? (configsToUpdate.playerStatusUpdateMs = playerStatusUpdateMs)
        : null;
    } else if (subcommand === "commands") {
      const maxRadioSongs = message.options.getNumber(
        SLASH_COMMAND_OPTIONS_NAMES.maxRadioSongs.name
      );
      const addMultipleSongsMaxCount = message.options.getNumber(
        SLASH_COMMAND_OPTIONS_NAMES.addMultipleSongsMaxCount.name
      );
      const ytPlayerMaxSongDuration = message.options.getNumber(
        SLASH_COMMAND_OPTIONS_NAMES.ytPlayerMaxSongDuration.name
      );
      const ytPlayerMinViews = message.options.getNumber(
        SLASH_COMMAND_OPTIONS_NAMES.ytPlayerMinViews.name
      );

      maxRadioSongs ? (configsToUpdate.maxRadioSongs = maxRadioSongs) : null;
      addMultipleSongsMaxCount
        ? (configsToUpdate.addMultipleSongsMaxCount = addMultipleSongsMaxCount)
        : null;

      ytPlayerMaxSongDuration
        ? (configsToUpdate.ytPlayerMaxSongDuration = ytPlayerMaxSongDuration)
        : null;

      ytPlayerMinViews
        ? (configsToUpdate.ytPlayerMinViews = ytPlayerMinViews)
        : null;
    } else if (subcommand === "defaults") {
      const resetToDefaults = message.options.getBoolean(
        SLASH_COMMAND_DEFAULT_OPTION_NAME
      );

      if (resetToDefaults) {
        ConfigsHandler.resetToDefaults();
        return await message.reply("Configs reseted to defaults");
      }

      await message.reply("You didn't set to true - skip");
    } else {
      await message.reply("No subcommand selected");
    }

    await message.reply(
      `New ${subcommand} options:\n ${getMessageOfChangedConfigs(configsToUpdate)}`
    );

    ConfigsHandler.editConfigsFile(configsToUpdate);
  } else {
    await message.reply("Something went wrong. Try again");
  }
};

const data = new SlashCommandBuilder()
  .setName(COMMAND_DATA.name.replaceAll(" ", "-"))
  .setDescription(COMMAND_DATA.description)
  .setDefaultMemberPermissions("0")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("defaults")
      .setDescription("Defaults")
      .addBooleanOption((option) =>
        option
          .setName(SLASH_COMMAND_DEFAULT_OPTION_NAME)
          .setDescription("Set configs to defaults")
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("player")
      .setDescription("Configs for player")
      .addNumberOption((option) =>
        option
          .setName(SLASH_COMMAND_OPTIONS_NAMES.maxIdleTimeMs.name)
          .setDescription(SLASH_COMMAND_OPTIONS_NAMES.maxIdleTimeMs.description)
          .setMinValue(1000)
          .setRequired(false)
      )
      .addNumberOption((option) =>
        option
          .setName(SLASH_COMMAND_OPTIONS_NAMES.playerStatusUpdateMs.name)
          .setDescription(
            SLASH_COMMAND_OPTIONS_NAMES.playerStatusUpdateMs.description
          )
          .setMinValue(1000)
          .setRequired(false)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("commands")
      .setDescription("Configs for options")
      .addNumberOption((option) =>
        option
          .setName(SLASH_COMMAND_OPTIONS_NAMES.addMultipleSongsMaxCount.name)
          .setDescription(
            SLASH_COMMAND_OPTIONS_NAMES.addMultipleSongsMaxCount.description
          )
          .setMinValue(1)
          .setMaxValue(50)
          .setRequired(false)
      )
      .addNumberOption((option) =>
        option
          .setName(SLASH_COMMAND_OPTIONS_NAMES.maxRadioSongs.name)
          .setDescription(SLASH_COMMAND_OPTIONS_NAMES.maxRadioSongs.description)
          .setMinValue(2)
          .setMaxValue(100)
          .setRequired(false)
      )
      .addNumberOption((option) =>
        option
          .setName(SLASH_COMMAND_OPTIONS_NAMES.ytPlayerMaxSongDuration.name)
          .setDescription(
            SLASH_COMMAND_OPTIONS_NAMES.ytPlayerMaxSongDuration.description
          )
          .setMinValue(0)
          .setRequired(false)
      )
      .addNumberOption((option) =>
        option
          .setName(SLASH_COMMAND_OPTIONS_NAMES.ytPlayerMinViews.name)
          .setDescription(
            SLASH_COMMAND_OPTIONS_NAMES.ytPlayerMinViews.description
          )
          .setMinValue(0)
          .setRequired(false)
      )
  );

const needsToBeInSameVoiceChannel = true;

export {
  data,
  slashConfigsCommands as execute,
  COMMAND_DATA as command,
  configsCommand as executeAsText,
  needsToBeInSameVoiceChannel
};
