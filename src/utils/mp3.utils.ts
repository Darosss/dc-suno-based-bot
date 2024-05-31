const fs = require("fs");
const mp3Duration = require("mp3-duration");
const { musicFolder } = require("./globals");

function getMp3Duration(mp3FilePath) {
  return new Promise((resolve, reject) => {
    mp3Duration(mp3FilePath, (err, duration) => {
      if (err) {
        reject(err);
      } else {
        resolve(duration);
      }
    });
  });
}

function getMp3FromMusicFolder() {
  return fs.readdirSync(musicFolder).filter((file) => file.endsWith(".mp3"));
}

module.exports = { getMp3Duration, getMp3FromMusicFolder };
