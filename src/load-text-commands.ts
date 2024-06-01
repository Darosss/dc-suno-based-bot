import { BaseCommandReturnType, ClientWithCommands } from "./types";
import path from "path";
import fs from "fs";
import { COMMANDS_PATH } from "./globals";
import { Collection } from "discord.js";

export const loadTextCommands = async (client: ClientWithCommands) => {
  client.textCommands = new Collection();
  const commandFiles = fs
    .readdirSync(COMMANDS_PATH)
    .filter((fileName) => fileName.endsWith(".js"));
  for await (const cmdFile of commandFiles) {
    const command = await import(path.join(COMMANDS_PATH, cmdFile));
    if ("command" in command && "executeAsText" in command) {
      const commandAsserted = command as BaseCommandReturnType;

      client.textCommands.set(commandAsserted.command.name, {
        execute: commandAsserted.executeAsText,
        needsToBeInSameVoiceChannel: commandAsserted.needsToBeInSameVoiceChannel
      });
      console.log(`Added ${commandAsserted.command.name}`);
    } else {
      console.log(
        `[WARNING] The command at ${cmdFile} is missing a required "command" or "executeAsText" property.`
      );
    }
  }
};
