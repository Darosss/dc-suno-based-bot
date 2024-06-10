import { load as cherrioLoad } from "cheerio";
import fs from "fs";
import https from "https";
import { MUSIC_FOLDER, SONG_DATA_SEPARATOR } from "../globals";
import internal from "stream";
import ytdl from "ytdl-core";
import path from "path";
import { isFileAccesilbe } from "./files.utils";
import { getMp3FilesWithInfo, getMp3FolderDirectorySize } from "./mp3.utils";
import sanitize from "sanitize-filename";
import { SongNamesAffixesEnum } from "@/src/enums";
import { StoredSongData } from "../types";

type SongData = {
  fileNameTitle?: string;
  songId: string;
};

type CommonReturnDownload = {
  message: string;
  fileData?: StoredSongData;
};

(async () => {
  try {
    await fs.promises.mkdir(MUSIC_FOLDER, { recursive: true });
  } catch (err) {
    console.error(`Error creating directory ${MUSIC_FOLDER}:`, err);
  }
})();

class DownloadMp3Handler {
  private currentFolderSizeMB: number = 0;
  private maxFolderSizeMB: number = Number(process.env.MUSIC_FOLDER_MAX_MB);
  constructor() {
    this.init();
  }

  private async init() {
    this.currentFolderSizeMB = (await getMp3FolderDirectorySize()).sizeMB;
  }

  private async handleMaxMBMusicFolderLogic() {
    if (this.currentFolderSizeMB >= this.maxFolderSizeMB) {
      await this.removeExceedingDataFromMp3Folder();
    } else {
      console.log("All good! ");
    }
  }

  private increaseCurrentFolderSizeMB(value: number) {
    this.currentFolderSizeMB += value;
  }
  private decreaseCurrentFolderSizeMB(value: number) {
    this.currentFolderSizeMB -= value;
  }

  private async removeExceedingDataFromMp3Folder() {
    const filesWithStats = await getMp3FilesWithInfo();
    filesWithStats.sort((a, b) =>
      a.creationDate.getTime() > b.creationDate.getTime() ? 1 : -1
    );
    let leftMBToRemove = this.currentFolderSizeMB - this.maxFolderSizeMB;
    let i = 0;
    while (leftMBToRemove > 0) {
      const currentFileMB = filesWithStats[i].sizeMB;
      leftMBToRemove -= currentFileMB;
      this.decreaseCurrentFolderSizeMB(currentFileMB);
      const filePathToDelete = path.join(
        MUSIC_FOLDER,
        filesWithStats[i].fileName
      );
      console.log("Data MB exceed - need to delete", filePathToDelete);
      await fs.promises.unlink(filePathToDelete);
      i++;
    }
  }

  public async downloadYtMp3(
    streamYt: internal.Readable,
    videoDetails: ytdl.MoreVideoDetails,
    absoluteDownloadPath: string
  ): Promise<StoredSongData> {
    const titleSanitized = sanitize(videoDetails.title);
    const songName = sanitize(
      `${titleSanitized}${SONG_DATA_SEPARATOR}${videoDetails.videoId}${SONG_DATA_SEPARATOR}${SongNamesAffixesEnum.youtube}.mp3`
    );
    const songPath = path.join(MUSIC_FOLDER, songName);
    if (!(await isFileAccesilbe(songPath))) {
      const stream = fs.createWriteStream(
        path.join(absoluteDownloadPath, songName)
      );
      streamYt.pipe(stream);
      stream.on("finish", async () => {
        const MBWritten = stream.bytesWritten / 1000 / 1000;
        this.increaseCurrentFolderSizeMB(MBWritten);
        await this.handleMaxMBMusicFolderLogic();
      });
    }
    return {
      fileName: songName,
      id: videoDetails.videoId,
      name: titleSanitized,
      site: SongNamesAffixesEnum.youtube
    };
  }

  private async getMp3AndDownload(
    songData: SongData
  ): Promise<CommonReturnDownload> {
    const fileName = sanitize(
      `${songData.fileNameTitle}${SONG_DATA_SEPARATOR}${songData.songId}${SONG_DATA_SEPARATOR}${SongNamesAffixesEnum.suno}.mp3`
    );
    const filePath = path.join(MUSIC_FOLDER, fileName);
    if (!fs.existsSync(filePath)) {
      return new Promise((resolve, reject) => {
        https
          .get(`https://cdn1.suno.ai/${songData.songId}.mp3`, (res) => {
            const stream = fs.createWriteStream(filePath);

            res.pipe(stream);
            stream.on("finish", async () => {
              const MBWritten = stream.bytesWritten / 1000 / 1000;
              this.increaseCurrentFolderSizeMB(MBWritten);
              await this.handleMaxMBMusicFolderLogic();

              stream.close();

              return resolve({
                message: `File ${songData.fileNameTitle} downloaded.`,
                fileData: {
                  fileName,
                  id: songData.songId,
                  name: songData.fileNameTitle!,
                  site: SongNamesAffixesEnum.suno
                }
              });
            });
            stream.on("error", (err) => {
              console.error(
                "Error occured while trying to save mp3:",
                err.message
              );
              return resolve({ message: "Probably can't play this file" });
            });
          })
          .on("error", (err) => {
            console.error(
              "Error occured while trying to get mp3 from site: " + err.message
            );
            reject({ message: "Something went wrong." });
          });
      });
    } else {
      return {
        message: `${fileName} already exists.`,
        fileData: {
          fileName,
          id: songData.songId,
          name: songData.fileNameTitle!,
          site: SongNamesAffixesEnum.suno
        }
      };
    }
  }

  public async downloadMP3(url: string): Promise<CommonReturnDownload> {
    return new Promise((resolve, reject) => {
      return https
        .get(url, (res) => {
          let data = "";
          const songData: SongData = {
            fileNameTitle: "",
            songId: url.split("/").at(-1) || ""
          };
          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", async () => {
            const $ = cherrioLoad(data);
            const foundTitleSplitted = $("title").text().split("by");

            if (foundTitleSplitted.length <= 1 && foundTitleSplitted.at(0))
              return resolve({ message: "Song isn't found" });

            songData.fileNameTitle = foundTitleSplitted.at(0)?.trim();
            if (!songData.songId || !songData.fileNameTitle)
              return resolve({ message: "Song id or file name is wrong" });
            try {
              const { message, fileData } =
                await this.getMp3AndDownload(songData);
              if (!fileData) return resolve({ message });
              return resolve({ fileData, message: `Added ${fileData.name}` });
            } catch (error) {
              throw error;
            }
          });
        })
        .on("error", (err) => {
          console.error(
            "Error occured while trying to get song name :" + err.message
          );
          reject({ message: "Some error occured" });
        });
    });
  }
}

export default new DownloadMp3Handler();
