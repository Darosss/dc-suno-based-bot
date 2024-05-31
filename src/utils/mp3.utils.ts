import fs from "fs";
import mp3Duration from "mp3-duration";
import { MUSIC_FOLDER } from "@/src/globals";

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
