const PlayerQueue = require("../player-queue");
function skipCommand(message) {
  if (message.member.id !== process.env.OWNER_ID)
    return message.reply("Only owner can do this (for now) ");
  PlayerQueue.skip(message);

  return message.reply("Song skipped!");
}

module.exports = { skipCommand };
