import { BaseButtonInteractionReturnType, ClientWithCommands } from "./types";
import path from "path";
import fs from "fs";
import { COMMANDS_PATH } from "./globals";
import { Collection } from "discord.js";

export const loadButtonInteractions = async (client: ClientWithCommands) => {
  client.buttonInteractions = new Collection();
  const commandFiles = fs
    .readdirSync(COMMANDS_PATH)
    .filter((fileName) => fileName.endsWith(".js"));
  for await (const cmdFile of commandFiles) {
    const command = await import(path.join(COMMANDS_PATH, cmdFile));
    if (
      "executeAsButton" in command &&
      "buttonInterractionCustomIdPrefix" in command
    ) {
      const interractionsDataAsserted =
        command as BaseButtonInteractionReturnType;

      client.buttonInteractions.set(
        interractionsDataAsserted.buttonInterractionCustomIdPrefix,
        {
          execute: interractionsDataAsserted.executeAsButton,
          executeOpts: interractionsDataAsserted.executeOpts
        }
      );
      console.log(
        `Button interraction added ${interractionsDataAsserted.buttonInterractionCustomIdPrefix}`
      );
    }
  }
};
