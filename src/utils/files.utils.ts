import fs from "fs";
import { TODO } from "../types";

export const isFileAccesilbe = async (
  absolutePath: string
): Promise<boolean> => {
  try {
    await fs.promises.access(absolutePath, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
};

export const deleteFile = async (filePath: string) => {
  try {
    await fs.promises.unlink(filePath);
    console.log(`File at ${filePath} deleted successfully.`);
  } catch (error) {
    if ("code" in (error as TODO) && (error as TODO).code === "ENOENT") {
      console.log(`File at ${filePath} does not exist, no action taken.`);
    } else {
      console.error(
        "Error occured while trying to remove exceeding data from mp3 folder",
        error
      );
    }
  }
};

export const ensureDirectoryExists = (directoryPath: string): void => {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
};
