import { CheerioAPI, load as cherrioLoad } from "cheerio";
import https from "https";
import {
  MUSIC_FOLDER,
  SONG_DATA_SEPARATOR,
  SUNO_BASE_API_URL
} from "../globals";
import internal from "stream";
import ytdl from "ytdl-core";
import path from "path";
import { isFileAccesilbe } from "./files.utils";
import { getMp3FilesWithInfo, getMp3FolderDirectorySize } from "./mp3.utils";
import sanitize from "sanitize-filename";
import { SongNamesAffixesEnum } from "@/src/enums";
import { StoredSongData, SunoApiClipNeededData } from "../types";
import fs from "fs";
import { IncomingMessage } from "http";

type SongData = {
  fileNameTitle?: string;
  songId: string;
};

type CommonReturnDownload = {
  message: string;
  fileData?: StoredSongData;
};
type CommonReturnInfo = {
  message: string;
  fileData?: SongData;
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
  private COMMON_ERROR_API_MESSAGE = "Couldn't get an api call. Try again or";
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
          .get(
            `https://cdn1.suno.ai/${songData.songId}.mp3`,
            (res: IncomingMessage) => {
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
            }
          )
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

  public async getSongDetailsWithCheerio(
    songId: string
  ): Promise<CommonReturnInfo> {
    const sunoUrl = `https://suno.com/song/${songId}`;
    return new Promise((resolve, reject) => {
      return https
        .get(sunoUrl, (res) => {
          let data = "";
          const songData: SongData = {
            fileNameTitle: "",
            songId
          };
          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", async () => {
            const $ = cherrioLoad(data);
            const songWebDetails = this._handleGetSunoSongDetailsFromWeb(
              $,
              songId
            );
            if (!songWebDetails.foundTitle)
              return resolve({ message: "Song isn't found" });

            const foundTitleSplitted = $("title").text().split("by");

            if (foundTitleSplitted.length <= 1 && foundTitleSplitted.at(0))
              return resolve({ message: "Song isn't found" });

            songData.fileNameTitle = songWebDetails.foundTitle.trim();

            if (!songData.songId || !songData.fileNameTitle)
              return resolve({ message: "Song id or file name is wrong" });

            return resolve({
              fileData: songData,
              message: "Got web info with cheerio"
            });
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

  private async getSongsDetailsFromApi(
    songId: string
  ): Promise<CommonReturnInfo> {
    const clipUrl = `${SUNO_BASE_API_URL}/clip/${songId}`;
    console.log(clipUrl);
    try {
      const response = await fetch(clipUrl, {
        method: "GET"
      });
      const data = await response.json();
      if ("audio_url" in data && "id" in data) {
        const dataAsSunoApiClipNeededData = data as SunoApiClipNeededData;
        return {
          message: "Found song from api",
          fileData: {
            fileNameTitle: dataAsSunoApiClipNeededData.title,
            songId
          }
        };
      } else {
        return { message: this.COMMON_ERROR_API_MESSAGE };
      }
    } catch (err) {
      console.error(err);
      return {
        message: this.COMMON_ERROR_API_MESSAGE
      };
    }
  }

  public async downloadSunoMP3(songId: string): Promise<CommonReturnDownload> {
    try {
      let songData: SongData | null = null;
      let errorMessages: String[] = [];

      if (!process.env.FORCE_CHEERIO_UPDATE_SONGS) {
        const { fileData, message } = await this.getSongsDetailsFromApi(songId);
        if (!fileData) {
          errorMessages.push(message);
        } else {
          songData = fileData;
        }
      }

      if (!songData) {
        const { fileData, message } =
          await this.getSongDetailsWithCheerio(songId);
        if (!fileData) {
          errorMessages.push(message);
        } else {
          songData = fileData;
        }
      }

      if (!songData) {
        return { message: errorMessages.join(" | ") };
      }

      const { message, fileData: storedFileData } =
        await this.getMp3AndDownload(songData);
      if (!storedFileData) return { message };
      return {
        fileData: storedFileData,
        message: `Added ${storedFileData.name}`
      };
    } catch (error) {
      throw error;
    }
  }
  private _handleGetSunoSongDetailsFromWeb($: CheerioAPI, songId: string) {
    const foundPageTitleSplitted = $("title").text().split("by");
    let foundTitle = foundPageTitleSplitted.at(0) || null;
    //Note: in case where title isn't a song name, check scripts for name
    const splitedScripts = $.html().split("</script>");
    const titlesRegex = [
      /\\"title\\":\\"(.*?)\\"/,
      /\{\"property\":\"og:title\",\"content\":\"(.*?)\"}/,
      /\{\"name\":\"twitter:title\",\"content\":\"(.*?)\"}/
    ];
    for (let i = 0; i < splitedScripts.length; i++) {
      const currentScriptString = splitedScripts[i];

      //TODO: make it better -> need to imrpove sometimes doesn't find the title from here
      if (foundTitle) break;
      else if (!currentScriptString.includes(songId!)) continue;

      for (const regexTitle of titlesRegex) {
        foundTitle = currentScriptString.match(regexTitle)?.at(1) || null;
      }
    }
    return { foundTitle };
  }
}

export default new DownloadMp3Handler();
