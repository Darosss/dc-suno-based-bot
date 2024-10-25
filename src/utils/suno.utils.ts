import { validate as isValidUUID } from "uuid";

export const isSunoSong = (promptString: string) => {
  if (promptString.includes("song/")) return true;
  else if (isValidUUID(promptString)) return true;
};
