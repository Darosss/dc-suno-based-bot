declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production";
      BOT_TOKEN: string;
      APP_ID: string;
      COMMANDS_PREFIX: string;
      OWNER_ID: string;
      SERVER_PORT: string;
      BOT_COMMANDS_CHANNEL_ID: string;
      BOT_STATUS_CHANNEL_ID: string;
      MUSIC_FOLDER_MAX_MB: string;
      FFPROBE_PATH?: string;
    }
  }
}

export {};
