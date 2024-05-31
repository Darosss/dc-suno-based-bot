const { downloadMP3 } = require("../download-logic");
const COMMANDS = require("./commands-list");
const PlayerQueue = require("../player-queue");
const downloadFolder = "music";
const { getMp3FromMusicFolder } = require("../mp3.utils");

const baseWrongMessageReply = `Give me correct command - example: ${process.env.COMMANDS_PREFIX}${COMMANDS.PLAY} https://suno.com/song/04db00ab-f7d7-40f8-a584-124b096beb31`;

async function playCommand(message) {
  const messageSplited = message.content.split(COMMANDS.PLAY);

  if (!message.content.includes("https://suno.com/song/"))
    return findByName(message, messageSplited.at(-1));

  const songUrl = messageSplited.at(-1);

  const songId = songUrl.split("/").at(-1);

  if (!songId) {
    return message.reply(baseWrongMessageReply);
  } else {
    const { message: downloadMessage, fileName } = await downloadMP3(
      songUrl,
      downloadFolder
    );
    if (!fileName) return;

    const channel = message.member.voice.channel;
    if (!channel) {
      return message.reply("You need to join a voice channel first!");
    }

    PlayerQueue.setConnection(channel).then(() => {
      PlayerQueue.enqueue(fileName, {
        resume: true,
        message
      });
    });

    return message.reply(downloadMessage);
  }
}
function findByName(message, songName) {
  const channel = message.member.voice.channel;

  if (!channel) {
    return message.reply("You need to join a voice channel first!");
  }
  const files = getMp3FromMusicFolder();
  const foundName = files.find((name) => {
    return name.toLowerCase().includes(songName.trim().toLowerCase());
  });
  if (!foundName) return message.reply("No song with your search");

  PlayerQueue.setConnection(channel).then(() => {
    PlayerQueue.enqueue(foundName, {
      resume: true,
      message
    });
  });
  return message.reply(`Added ${foundName}`);
}

module.exports = { playCommand };
