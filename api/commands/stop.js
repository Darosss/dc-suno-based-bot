const PlayerQueue = require("../player-queue");
function stopCommand(message) {
  if (message.member.id !== process.env.OWNER_ID)
    return message.reply("Only owner can do this (for now) ");
  else {
    PlayerQueue.stop();

    return message.reply("Player stopped!");
  }
}

module.exports = { stopCommand };
