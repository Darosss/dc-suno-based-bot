import {
  VoiceConnectionStatus,
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  VoiceConnection,
  AudioPlayer
} from "@discordjs/voice";
import { MUSIC_FOLDER } from "@/src/globals";
import { getMp3Duration } from "@/utils/mp3.utils";
import path from "path";
import { Message, VoiceBasedChannel } from "discord.js";

type EnqueueOptions = { resume: boolean; message: Message };

type PlayerQueueItemType = { name: string; requester: string };

class PlayerQueue {
  private items: PlayerQueueItemType[];
  private playTimeout: NodeJS.Timeout | null;
  private connection: VoiceConnection | null;
  private audioPlayer: AudioPlayer | null;
  private currentSong: PlayerQueueItemType | null;
  constructor() {
    this.items = [];
    this.playTimeout = null;
    this.connection = null;
    this.currentSong = null;
    this.audioPlayer = null;
  }

  enqueue(item: PlayerQueueItemType, options?: EnqueueOptions) {
    const { resume, message } = options || {};
    this.items.push(item);
    console.log(`Item ${item.name} by ${item.requester} inserted`);
    if (resume && message && this.playTimeout === null) {
      this.start(message);
    }
  }

  clearPlayTimeout() {
    this.playTimeout ? clearTimeout(this.playTimeout) : null;
    this.playTimeout = null;
  }

  dequeue() {
    if (this.isEmpty()) {
      console.log("No items in queue");
      return null;
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

  async setConnection(channel: VoiceBasedChannel) {
    this.connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guildId,
      adapterCreator: channel.guild.voiceAdapterCreator
    });
    this.connection.on(VoiceConnectionStatus.Ready, () => {
      console.log("The bot has connected to the channel!");
    });
    this.audioPlayer = createAudioPlayer();
  }

  start(message: Message, delay = 1000) {
    if (this.isEmpty()) {
      return message.reply("Add more songs to play :)");
    }
    this.playTimeout ? clearInterval(this.playTimeout) : null;

    this.playTimeout = setTimeout(() => {
      try {
        this.currentSong = this.dequeue() || null;
        if (!this.currentSong) return console.error("No current song to play");
        const songPath = path.join(MUSIC_FOLDER, this.currentSong.name);
        const resource = createAudioResource(songPath);

        if (!this.audioPlayer || !this.connection)
          return console.error("No audio player or connection :(");

        this.audioPlayer.play(resource);

        this.connection.subscribe(this.audioPlayer);

        getMp3Duration(songPath)
          .then((duration) => {
            message.reply(
              `------
              Now playing: \`${this.currentSong!.name}\`  
              ${
                this.peek()
                  ? `Next(in ${Math.floor(duration)} sec)  \`${this.peek()?.name} \``
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
    this.audioPlayer?.stop();
    this.items = [];
  }

  skip(message: Message) {
    this.audioPlayer?.stop();

    if (this.isEmpty()) {
      this.clearPlayTimeout();
    } else {
      this.start(message);
    }
  }
}

export default new PlayerQueue();
