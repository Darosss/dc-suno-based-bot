const { load: cherrioLoad } = require("cheerio");
const fs = require("fs");
const https = require("https");

function downloadMP3(url, downloadPath) {
  return new Promise((resolve, reject) => {
    return https
      .get(url, (res) => {
        let data = "";
        const songData = {
          fileNameTitle: "",
          songId: url.split("/").at(-1),
        };
        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", async () => {
          const $ = cherrioLoad(data);
          const foundTitleSplitted = $("title").text().split("by");

          if (foundTitleSplitted.length <= 1 && foundTitleSplitted)
            return resolve({ message: "Song isn't found" });

          songData.fileNameTitle = foundTitleSplitted.at(0).trim();

          const { /*message*/ fileName } = await getMp3AndDownload(
            songData,
            downloadPath
          );
          return resolve({ fileName, message: `Added ${fileName}` });
        });
      })
      .on("error", (err) => {
        console.error("Error: " + err.message);
        reject({ message: "Some error occured" });
      });
  });
}

async function getMp3AndDownload(songData, downloadPath) {
  const fileName = `${songData.fileNameTitle} - ${songData.songId}.mp3`;
  const filePath = `${downloadPath}/${fileName}`;
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
              fileName,
            });
          });
        })
        .on("error", (err) => {
          console.error("Error: " + err.message);
          reject({ message: "Something went wrong." });
        });
    });
  } else {
    return { message: `${fileName} already exists.`, fileName };
  }
}

module.exports = { downloadMP3 };
