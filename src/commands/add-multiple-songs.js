const { downloadMP3 } = require("../download-logic");
const COMMANDS = require("./commands-list");

const downloadFolder = "music";
const MAX_SONGS = 5;
const baseWrongMessageReply = `_Give me correct songs ids each separated by [;] (semicolon)_
- example: 
\`${process.env.COMMANDS_PREFIX}${COMMANDS.ADD_MULTIPLE_SONGS} https://suno.com/song/04db00ab-f7d7-40f8-a584-124b096beb31;https://suno.com/song/f1d5aad1-ec23-42e7-9e47-2617ea2de69a`;

async function addMultipleSongs(message) {
  const messageSplited = message.content.split(COMMANDS.ADD_MULTIPLE_SONGS);

  const songsUrls = messageSplited.at(-1);

  if (songsUrls.length <= 0) {
    return message.reply(baseWrongMessageReply);
  } else {
    const songsUrlSplittedUnique = Array.from(
      new Set(songsUrls.split(";"))
    ).filter((url) => url.includes("https://suno.com/song/"));
    if (songsUrlSplittedUnique.length >= MAX_SONGS) {
      return message.reply(`No more than ${MAX_SONGS} songs`);
    }

    const messagesToSend = [`<@${message.member.id}>`];
    for await (const songUrl of songsUrlSplittedUnique) {
      const { message: downloadMessage } = await downloadMP3(
        songUrl.trim(),
        downloadFolder
      );
      messagesToSend.push(downloadMessage);
    }

    return message.reply(messagesToSend.join("\n"));
  }
}

module.exports = { addMultipleSongs };
