import fs from "fs";
import fsAsync from "fs/promises";
import mp3Duration from "mp3-duration";
import { MUSIC_FOLDER } from "@/src/globals";
import path from "path";

export const getMp3Duration = async (mp3FilePath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    mp3Duration(mp3FilePath, (err, duration) => {
      if (err) {
        reject(err);
      } else {
        resolve(duration);
      }
    });
  });
};
export const getMp3FromMusicFolder = () =>
  fs.readdirSync(MUSIC_FOLDER).filter((file) => file.endsWith(".mp3"));

export const saveMp3ListToFile = async (
  mp3FilesNames: string[]
): Promise<string> => {
  const tempFilePath = path.join(MUSIC_FOLDER, "mp3list.txt");
  const fileContent = mp3FilesNames.join("\n");
  await fsAsync.writeFile(tempFilePath, fileContent);
  return tempFilePath;
};
