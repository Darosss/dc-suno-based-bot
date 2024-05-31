const {
  VoiceConnectionStatus,
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource
} = require("@discordjs/voice");
const { musicFolder } = require("./globals");
const { getMp3Duration } = require("./mp3.utils");
const path = require("path");

class PlayerQueue {
  constructor() {
    this.items = [];
    this.playTimeout = null;
    this.connection = null;
    this.currentSong = "";
    this.audioPlayer = null;
  }

  enqueue(item, { resume = false, message } = {}) {
    this.items.push(item);
    console.log(`Item ${item} inserted`);
    if (resume && message && this.playTimeout === null) {
      this.start(message);
    }
  }

  clearPlayTimeout() {
    clearTimeout(this.playTimeout);
    this.playTimeout = null;
  }

  dequeue() {
    if (this.isEmpty()) {
      return console.log("No items in queue");
    }
    return this.items.shift();
  }

  peek() {
    if (this.isEmpty()) {
      return console.log("No items in queue");
    }
    return this.items.at(0);
  }

  isEmpty() {
    return this.items.length == 0;
  }

  printQueue() {
    console.log(this.items.join(", "));
  }

  async setConnection(channel) {
    this.connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator
    });
    this.connection.on(VoiceConnectionStatus.Ready, () => {
      console.log("The bot has connected to the channel!");
    });
    this.audioPlayer = createAudioPlayer();
  }

  start(message, delay = 1000) {
    if (this.isEmpty()) {
      return message.reply("Add more songs to play :)");
    }
    this.playTimeout ? clearInterval(this.playTimeout) : null;

    this.playTimeout = setTimeout(() => {
      try {
        this.currentSong = this.dequeue();
        const songPath = path.join(musicFolder, this.currentSong);
        const resource = createAudioResource(songPath);

        this.audioPlayer.play(resource);

        this.connection.subscribe(this.audioPlayer);

        getMp3Duration(songPath)
          .then((duration) => {
            message.reply(
              `------
              Now playing: \`${this.currentSong}\`
              ${
                this.peek()
                  ? `Next(in ${Math.floor(duration)} sec)  \`${this.peek()} \``
                  : ""
              }`
            );

            this.start(message, duration * 1000);
          })
          .catch((err) => {
            console.error("Error:", err);
          });
      } catch (error) {
        console.error(error);
        message.reply("Failed to play the file.");
      }
    }, delay);
  }

  stop() {
    this.clearPlayTimeout();
    this.audioPlayer.stop();
    this.items = [];
  }

  skip(message) {
    this.audioPlayer.stop();

    if (this.isEmpty()) {
      this.clearPlayTimeout();
    } else {
      this.start(message);
    }
  }
}

module.exports = new PlayerQueue();
