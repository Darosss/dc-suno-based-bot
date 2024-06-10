import { CustomEnvTypes } from "../types";
const customEnvKeys: (keyof CustomEnvTypes)[] = [
  "NODE_ENV",
  "BOT_TOKEN",
  "APP_ID",
  "COMMANDS_PREFIX",
  "OWNER_ID",
  "SERVER_PORT",
  "BOT_COMMANDS_CHANNEL_ID",
  "BOT_STATUS_CHANNEL_ID",
  "MUSIC_FOLDER_MAX_MB"
];
const expectedTypes: { [K in keyof CustomEnvTypes]: string[] } = {
  NODE_ENV: ["string"],
  BOT_TOKEN: ["string"],
  APP_ID: ["string", "number"],
  COMMANDS_PREFIX: ["string"],
  OWNER_ID: ["string", "number"],
  SERVER_PORT: ["number"],
  BOT_COMMANDS_CHANNEL_ID: ["string", "number"],
  BOT_STATUS_CHANNEL_ID: ["string", "number"],
  MUSIC_FOLDER_MAX_MB: ["number"],
  FFPROBE_PATH: ["string", "undefined"]
};
class EnvChecker {
  private errors: string[] = [];
  constructor() {}
  public init() {
    customEnvKeys.forEach((key) => {
      const value = process.env[key];
      const expectedType = expectedTypes[key];

      if (!expectedType?.includes(this.getType(value))) {
        this.errors.push(`${key} must be a ${expectedType}`);
      }
    });

    if (this.errors.length > 0) {
      this.errors.forEach((error) => console.error(error));
      process.exit(1); // Exit the process with an error code
    } else {
      console.log("All environment variables are correctly set.");
    }
  }

  private getType(value: any): string {
    if (value === null || value === undefined) return "undefined";
    if (Array.isArray(value)) return "array";
    if (typeof value === "string" && !isNaN(Number(value))) return "number";
    return typeof value;
  }
}

export default EnvChecker;
