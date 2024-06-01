declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production";
      BOT_TOKEN: string;
      APP_ID: string;
      COMMANDS_PREFIX: string;
      OWNER_ID: string;
      SERVER_PORT: string;
    }
  }
}

export {};
