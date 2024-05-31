import { Message } from "discord.js";

export type COMMANDS_NAMES =
  | "play"
  | "skip"
  | "stop"
  | "radio"
  | "add many songs"
  | "commands";

export type CommandsType = {
  name: string /**alias: string[] */;
  description: string;
};
export const COMMANDS: Record<COMMANDS_NAMES, CommandsType> = {
  play: {
    name: "play",
    description: `Play any song from suno you want.`
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
  }
};

export const commandsListCommand = (message: Message) => {
  const commandsListMsg = Object.values(COMMANDS).map(
    (command) =>
      `\`${process.env.COMMANDS_PREFIX}${command.name}\` - ${command.description}`
  );
  return message.reply(
    `Possible commands are:\n ${commandsListMsg.join("\n")}`
  );
};
