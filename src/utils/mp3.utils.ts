import fs from "fs";
import fsAsync from "fs/promises";
import { MUSIC_FOLDER, SONG_DATA_SEPARATOR } from "@/src/globals";
import path from "path";
import getAudioDurationInSeconds from "get-audio-duration";
import { StoredSongData } from "../types";
import { SongNamesAffixesEnum } from "../enums";

export const ALL_POSSIBLE_AUDIOS_PATH = path.join(
  MUSIC_FOLDER,
  "allMp3List.txt"
);

export const getStoredSongDataFromFileName = (
  fileName: string
): StoredSongData => {
  const separatedFileName = fileName
    .split(".mp3")[0]
    .split(SONG_DATA_SEPARATOR);
  const name = separatedFileName[0];
  const id = separatedFileName[1];
  const site: SongNamesAffixesEnum =
    separatedFileName.at(2) === SongNamesAffixesEnum.suno
      ? SongNamesAffixesEnum.suno
      : SongNamesAffixesEnum.youtube;

  return { fileName, name, id, site };
};

export const getMp3Duration = async (mp3FilePath: string): Promise<number> => {
  return await getAudioDurationInSeconds(mp3FilePath, process.env.FFPROBE_PATH);
};
export const getMp3FromMusicFolder = async (): Promise<StoredSongData[]> =>
  (await fs.promises.readdir(MUSIC_FOLDER, { encoding: "utf-8" }))
    .filter((file) => file.endsWith(".mp3"))
    .map((fileName) => getStoredSongDataFromFileName(fileName));

export const getMp3FolderDirectorySize = async () => {
  const data = await getMp3DirectorySize();
  return data;
};

export const getAllPossibleAudios = async (): Promise<string> => {
  try {
    const allMp3List = await fs.promises.readFile(ALL_POSSIBLE_AUDIOS_PATH, {
      encoding: "utf-8"
    });

    return allMp3List;
  } catch {
    return "";
  }
};

export const updateMp3ToPossibleList = async (
  mp3FilesData: string[]
): Promise<string> => {
  const currentAudiosData: StoredSongData[] = [];
  const possibleIds: string[] = [];
  (await getAllPossibleAudios()).split("\n").forEach((line) => {
    const lineData = getStoredSongDataFromFileName(line);
    possibleIds.push(lineData.id);
    currentAudiosData.push(lineData);
  });

  for (let i = 0; i < mp3FilesData.length; i++) {
    const fileDataSongData = getStoredSongDataFromFileName(mp3FilesData[i]);

    const foundId = possibleIds.find((id) => id === fileDataSongData.id);
    if (foundId) {
      const indexOfCurrentData = currentAudiosData.findIndex(
        ({ id }) => id === foundId
      )!;

      currentAudiosData[indexOfCurrentData] = fileDataSongData;
    } else {
      currentAudiosData.push(fileDataSongData);
    }
  }
  const allSongsDataInTxt = currentAudiosData
    .map((data) => data.fileName)
    .join("\n");
  await fsAsync.writeFile(ALL_POSSIBLE_AUDIOS_PATH, allSongsDataInTxt);
  return ALL_POSSIBLE_AUDIOS_PATH;
};

export const saveMp3ListToFile = async (mp3FilesData: StoredSongData[]) => {
  const tempFilePath = path.join(MUSIC_FOLDER, "mp3list.txt");
  const fileContent = mp3FilesData.map((data) => data.fileName).join("\n");
  await fsAsync.writeFile(tempFilePath, fileContent);
  return {
    path: tempFilePath,
    data: fileContent
  };
};

export const getMp3DirectorySize = async () => {
  try {
    const files = await getMp3FromMusicFolder();

    const fileStats = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(MUSIC_FOLDER, file.fileName);
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
    const filePath = path.join(MUSIC_FOLDER, file.fileName);
    const stats = fs.statSync(filePath);

    return {
      fileName: file.fileName,
      creationDate: stats.birthtime,
      sizeMB: stats.size / (1024 * 1024)
    };
  });

  return filesWithInfo;
};
