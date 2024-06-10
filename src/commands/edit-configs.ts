import {
  ChannelType,
  CommandInteractionOption,
  Message,
  SlashCommandBuilder
} from "discord.js";
import { COMMANDS } from "./commands-list";

import { BaseExecuteOptions, MessageInteractionTypes } from "../types";
import { ConfigsType } from "@/utils/configs.utils";
import ConfigsHandler from "@/utils/configs.utils";

const COMMAND_DATA = COMMANDS["edit configs"];

type FilledOptionsKeysType = Pick<CommandInteractionOption, "value"> & {
  name: keyof ConfigsType;
  channelId?: string;
};

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
  },
  botStatusChannelId: {
    name: "bot-status-channel-id",
    description: "Set channel id for bot music player status"
  },
  botComandsChannelId: {
    name: "bot-commands-channel-id",
    description: "Set channel id for bot commands channel"
  }
};

const getMessageOfChangedConfigs = (config: Partial<ConfigsType>) =>
  Object.entries(config)
    .filter(([, value]) => value)
    .map(([key, nonNullVal]) => `${key}: ${nonNullVal}`)
    .join("\n");

const configsCommand = (message: Message) => {
  return message.reply(
    "Yoo. Use slash command instead. Not working in text command(for now)"
  );
};

const slashConfigsCommands = async (message: MessageInteractionTypes) => {
  const configsToUpdate: Partial<ConfigsType> = {};

  if (!("getSubcommand" in message.options)) {
    return await message.reply("Something went wrong. Try again");
  }

  const subcommand = message.options.getSubcommand();
  if (subcommand === "defaults") {
    const resetToDefaults = message.options.getBoolean(
      SLASH_COMMAND_DEFAULT_OPTION_NAME
    );

    if (resetToDefaults) {
      ConfigsHandler.resetToDefaults();
      return await message.reply("Configs reseted to defaults");
    }

    await message.reply("You didn't set to true - skip");
  } else {
    const filledKeys = getFilledOptionsKeys(message);
    updateCommandsDependsOnFilledOptions(filledKeys, message, configsToUpdate);
  }

  await message.reply(
    `New ${subcommand} options:\n ${getMessageOfChangedConfigs(configsToUpdate)}`
  );

  ConfigsHandler.editConfigsFile(configsToUpdate);
};

const getFilledOptionsKeys = (message: MessageInteractionTypes) => {
  return message.options.data
    .filter((data) => data.options !== undefined)
    .flatMap<FilledOptionsKeysType>((messDataOpts) =>
      messDataOpts.options!.map((optVal) => {
        const fittingKey = Object.entries(SLASH_COMMAND_OPTIONS_NAMES)
          .find(([, optionNamesData]) => optionNamesData.name === optVal.name)!
          .at(0) as keyof ConfigsType;
        return {
          name: fittingKey,
          value: optVal.value,
          channelId: optVal.channel?.id
        };
      })
    );
};

const updateCommandsDependsOnFilledOptions = (
  filledKeys: FilledOptionsKeysType[],
  message: MessageInteractionTypes,
  configsToUpdate: Partial<ConfigsType>
) => {
  filledKeys.map((data) => {
    if (data?.channelId) {
      if ("getChannel" in message.options) {
        const keyAsConfigTypeKey = data.name;

        (configsToUpdate[keyAsConfigTypeKey] as string) = data.channelId;
      }
    } else {
      if (typeof data?.value === "number" && "getNumber" in message.options) {
        const keyAsConfigTypeKey = data.name;

        (configsToUpdate[keyAsConfigTypeKey] as number) = data.value;
      }
    }
  });
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
      .addChannelOption((option) =>
        option
          .setName(SLASH_COMMAND_OPTIONS_NAMES.botComandsChannelId.name)
          .setDescription(
            SLASH_COMMAND_OPTIONS_NAMES.botComandsChannelId.description
          )
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(false)
      )
      .addChannelOption((option) =>
        option
          .setName(SLASH_COMMAND_OPTIONS_NAMES.botStatusChannelId.name)
          .setDescription(
            SLASH_COMMAND_OPTIONS_NAMES.botStatusChannelId.description
          )
          .addChannelTypes(ChannelType.GuildText)
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

const executeOpts: BaseExecuteOptions = {
  onlyOwner: true
};
export {
  data,
  slashConfigsCommands as execute,
  COMMAND_DATA as command,
  configsCommand as executeAsText,
  executeOpts
};
