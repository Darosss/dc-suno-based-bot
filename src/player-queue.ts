import {
  VoiceConnectionStatus,
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  VoiceConnection,
  AudioPlayer
} from "@discordjs/voice";
import { MAX_IDLE_TIME_MS, MUSIC_FOLDER } from "@/src/globals";
import { getMp3Duration, isMp3Available } from "@/utils/mp3.utils";
import path from "path";
import { Message, VoiceBasedChannel } from "discord.js";
import { MessageCommandType } from "./types";

type EnqueueOptions = { resume: boolean; message: MessageCommandType };

type PlayerQueueItemType = { name: string; requester: string };

class PlayerQueue {
  private items: PlayerQueueItemType[];
  private playTimeout: NodeJS.Timeout | null;
  private connection: VoiceConnection | null;
  private audioPlayer: AudioPlayer | null;
  private currentSong: PlayerQueueItemType | null;
  private closeConnectionTimeout: NodeJS.Timeout | null = null;
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

  getCurrentSong() {
    return this.currentSong;
  }

  async setConnection(channel: VoiceBasedChannel) {
    if (this.connection) return;
    this.connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guildId,
      adapterCreator: channel.guild.voiceAdapterCreator
    });
    this.connection.on(VoiceConnectionStatus.Ready, () => {
      console.log("The bot has connected to the channel!");
    });
    this.audioPlayer = createAudioPlayer();

    this.audioPlayer.addListener("stateChange", (oldOne, newOne) => {
      if (newOne.status === "idle") {
        this.closeConnectionTimeout = setTimeout(() => {
          this.connection?.destroy();
          this.connection = null;
        }, MAX_IDLE_TIME_MS);
      } else {
        if (this.closeConnectionTimeout) {
          clearTimeout(this.closeConnectionTimeout);
          this.closeConnectionTimeout = null;
        }
      }
    });
  }

  start(message: MessageCommandType, delay = 1000) {
    if (this.isEmpty()) {
      return message.channel?.send("Add more songs to play :)");
    }
    this.playTimeout ? clearInterval(this.playTimeout) : null;

    this.playTimeout = setTimeout(() => {
      try {
        this.currentSong = this.dequeue() || null;
        if (!this.currentSong?.name)
          return console.error("No current song to play");
        const songPath = path.join(MUSIC_FOLDER, this.currentSong.name);
        if (!isMp3Available(songPath)) {
          console.log("No file found, skip");
          this.start(message, 1000);
        }
        const resource = createAudioResource(songPath);
        if (!this.audioPlayer || !this.connection)
          return console.error("No audio player or connection :(");
        this.audioPlayer.play(resource);

        this.connection.subscribe(this.audioPlayer);
        getMp3Duration(songPath)
          .then((duration) => {
            message.channel?.send(
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
        message.channel?.send("Failed to play the file.");
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
      return false;
    } else {
      this.start(message);
      return true;
    }
  }
}

export default new PlayerQueue();
