import { SlashCommandBuilder } from "discord.js";
import { MessageCommandType } from "../types";

export type COMMANDS_NAMES =
  | "play"
  | "yt play"
  | "skip"
  | "stop"
  | "radio"
  | "add many songs"
  | "commands"
  | "songs"
  | "shuffle"
  | "repeat"
  | "edit configs";

export type CommandsType = {
  name: string /**alias: string[] */;
  description: string;
};

export const COMMANDS: Record<COMMANDS_NAMES, CommandsType> = {
  play: {
    name: "play",
    description: `Play any song from suno you want.`
  },
  "yt play": {
    name: "yt play",
    description: `Play song from youtube.`
  },
  skip: { name: "skip", description: "Skips a song owner only(for now)" },
  stop: { name: "stop", description: "Stops a player owner only(for now)" },
  radio: { name: "radio", description: "Start a radio owner only(for now)" },
  "add many songs": {
    name: "add many songs",
    description: "Add songs form suno with multiple links"
  },
  commands: {
    name: "commands",
    description: "Get commands list"
  },
  songs: {
    name: "songs",
    description: "I will send you a DM message with possible files in .txt"
  },
  shuffle: {
    name: "shuffle",
    description: "Shuffle current player songs"
  },
  repeat: {
    name: "repeat",
    description: "Turn on/off repeat songs"
  },
  "edit configs": {
    name: "edit configs",
    description: "Change my configs"
  }
};

const COMMAND_DATA = COMMANDS.commands;

const commandsListCommand = (message: MessageCommandType) => {
  const commandsListMsg = Object.values(COMMANDS).map(
    (command) =>
      `\`${process.env.COMMANDS_PREFIX}${command.name}\` - ${command.description}`
  );

  const messageToSend = `Possible commands are:\n ${commandsListMsg.join("\n")}`;

  message.reply(messageToSend);
};

const data = new SlashCommandBuilder()
  .setName(COMMAND_DATA.name)
  .setDescription(COMMAND_DATA.description);

export {
  data,
  COMMAND_DATA as command,
  commandsListCommand as execute,
  commandsListCommand as executeAsText
};
