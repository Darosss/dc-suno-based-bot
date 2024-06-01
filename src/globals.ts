import path from "path";

export const DOWNLOAD_MUSIC_FOLDER = "music";
export const MUSIC_FOLDER = path.join(__dirname, DOWNLOAD_MUSIC_FOLDER);
export const DEFAULT_MAX_RADIO_SONGS = 10;
export const MAX_IDLE_TIME_MS = 25000;
export const COMMANDS_PATH = path.join(__dirname, "commands");
export const PLAYER_STATUS_UPDATE_MS = 10000;
