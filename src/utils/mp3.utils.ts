import fs from "fs";
import fsAsync from "fs/promises";
import { MUSIC_FOLDER } from "@/src/globals";
import path from "path";
import getAudioDurationInSeconds from "get-audio-duration";

export const getMp3Duration = async (mp3FilePath: string): Promise<number> => {
  return await getAudioDurationInSeconds(mp3FilePath);
};
export const getMp3FromMusicFolder = async () =>
  (await fs.promises.readdir(MUSIC_FOLDER, { encoding: "utf-8" })).filter(
    (file) => file.endsWith(".mp3")
  );

export const getMp3FolderDirectorySize = async () => {
  const data = await getMp3DirectorySize();
  return data;
};

export const saveMp3ListToFile = async (
  mp3FilesNames: string[]
): Promise<string> => {
  const tempFilePath = path.join(MUSIC_FOLDER, "mp3list.txt");
  const fileContent = mp3FilesNames.join("\n");
  await fsAsync.writeFile(tempFilePath, fileContent);
  return tempFilePath;
};

export const getMp3DirectorySize = async () => {
  try {
    const files = await getMp3FromMusicFolder();

    const fileStats = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(MUSIC_FOLDER, file);
        const stats = await fs.promises.stat(filePath);
        return stats.size;
      })
    );

    const totalSizeBytes = fileStats.reduce((total, size) => total + size, 0);

    const totalSizeMB = totalSizeBytes / (1024 * 1024);
    const totalSizeGB = totalSizeMB / 1024;

    return {
      sizeMB: totalSizeMB,
      sizeGB: totalSizeGB
    };
  } catch (err) {
    console.error("Error reading directory:", err);
    throw err;
  }
};

export const getMp3FilesWithInfo = async () => {
  const files = await getMp3FromMusicFolder();

  const filesWithInfo = files.map((file) => {
    const filePath = path.join(MUSIC_FOLDER, file);
    const stats = fs.statSync(filePath);

    return {
      fileName: file,
      creationDate: stats.birthtime,
      sizeMB: stats.size / (1024 * 1024)
    };
  });

  return filesWithInfo;
};
