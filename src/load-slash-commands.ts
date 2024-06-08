import {
  Collection,
  REST,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  Routes
} from "discord.js";
import { BaseCommandReturnType, ClientWithCommands } from "./types";
import path from "path";
import fs from "fs";
import { COMMANDS_PATH } from "./globals";

const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];

export const loadSlashCommands = async (client: ClientWithCommands) => {
  client.commands = new Collection();

  const commandFiles = fs
    .readdirSync(COMMANDS_PATH)
    .filter((fileName) => fileName.endsWith(".js"));
  for await (const cmdFile of commandFiles) {
    const command = await import(path.join(COMMANDS_PATH, cmdFile));

    if ("data" in command && "execute" in command) {
      const commandAsserted = command as BaseCommandReturnType;
      client.commands.set(commandAsserted.data!.name, {
        execute: commandAsserted.execute,
        executeOpts: commandAsserted.executeOpts
      });
      commands.push(commandAsserted.data.toJSON());
    } else {
      console.log(
        `[WARNING] The command at ${cmdFile} is missing a required "data" or "execute" property.`
      );
    }
  }
  await reloadSlashCommands();
};

const reloadSlashCommands = async () => {
  const rest = new REST().setToken(process.env.BOT_TOKEN);

  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    const data = await rest.put(
      Routes.applicationCommands(process.env.APP_ID),
      { body: commands }
    );

    console.log(
      `Successfully reloaded ${(data as { length: number }).length || ""} application (/) commands.`
    );
  } catch (error) {
    console.error(error);
  }
};
