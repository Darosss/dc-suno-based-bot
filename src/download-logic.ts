import { load as cherrioLoad } from "cheerio";
import fs from "fs";
import https from "https";
import { MUSIC_FOLDER } from "./globals";
type SongData = {
  fileNameTitle: string;
  songId: string;
};

type CommonReturnDownload = {
  message: string;
  fileName?: string;
};

(async () => {
  try {
    await fs.promises.mkdir(MUSIC_FOLDER, { recursive: true });
  } catch (err) {
    console.error(`Error creating directory ${MUSIC_FOLDER}:`, err);
  }
})();

export const downloadMP3 = async (
  url: string,
  absoluteDownloadPath: string
): Promise<CommonReturnDownload> => {
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

          songData.fileNameTitle = foundTitleSplitted.at(0)!.trim();
          try {
            const { message, fileName } = await getMp3AndDownload(
              songData,
              absoluteDownloadPath
            );
            if (!fileName) return resolve({ message });
            return resolve({ fileName, message: `Added ${fileName}` });
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
};

const getMp3AndDownload = async (
  songData: SongData,
  absoluteDownloadPath: string
): Promise<CommonReturnDownload> => {
  const fileName = `${songData.fileNameTitle} - ${songData.songId}.mp3`;
  const filePath = `${absoluteDownloadPath}/${fileName}`;
  if (!fs.existsSync(filePath)) {
    return new Promise((resolve, reject) => {
      https
        .get(`https://cdn1.suno.ai/${songData.songId}.mp3`, (res) => {
          const stream = fs.createWriteStream(filePath);

          res.pipe(stream);
          stream.on("finish", () => {
            stream.close();
            return resolve({
              message: `File ${songData.fileNameTitle} downloaded.`,
              fileName
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
    return { message: `${fileName} already exists.`, fileName };
  }
};
