export type COMMANDS_NAMES =
  | "play"
  | "skip"
  | "stop"
  | "radio"
  | "add many songs";

export type CommandsType = { name: string /**alias: string[] */ };
export const COMMANDS: Record<COMMANDS_NAMES, CommandsType> = {
  play: { name: "play" },
  skip: { name: "skip" },
  stop: { name: "stop" },
  radio: { name: "radio" },
  "add many songs": { name: "add many songs}" }
};
