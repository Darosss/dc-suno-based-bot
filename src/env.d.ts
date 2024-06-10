import { CustomEnvTypes } from "./types";

declare global {
  namespace NodeJS {
    interface ProcessEnv extends CustomEnvTypes {}
  }
}

export {};
