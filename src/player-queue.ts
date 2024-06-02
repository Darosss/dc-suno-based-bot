import {
  VoiceConnectionStatus,
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  VoiceConnection,
  AudioPlayer
} from "@discordjs/voice";
import {
  MAX_IDLE_TIME_MS,
  MUSIC_FOLDER,
  PLAYER_STATUS_UPDATE_MS
} from "@/src/globals";
import { getMp3Duration, isMp3Available } from "@/utils/mp3.utils";
import path from "path";
import { Message, VoiceBasedChannel } from "discord.js";
import { CurrentSongType, PlayerQueueItemType } from "./types";
import { client } from "./init-bot";
import { createSongEmbed, getBotCommandsChannel } from "./utils/dc.utils";

const BOT_STATUS_CHANNEL_ID = process.env.BOT_STATUS_CHANNEL_ID;
type EnqueueOptions = { resume: boolean };

type StatusDataType = {
  message: Message;
  interval: NodeJS.Timeout;
};

class PlayerQueue {
  private items: PlayerQueueItemType[];
  private playTimeout: NodeJS.Timeout | null = null;
  private connection: VoiceConnection | null = null;
  private audioPlayer: AudioPlayer | null = null;
  private currentSong: CurrentSongType | null = null;
  private closeConnectionTimeout: NodeJS.Timeout | null = null;
  private repeat: boolean = false;
  private statusData: StatusDataType | null = null;
  constructor() {
    this.items = [];
  }

  public async enqueue(item: PlayerQueueItemType, options?: EnqueueOptions) {
    const { resume } = options || {};
    this.items.push(item);
    console.log(`Item ${item.name} by ${item.requester} inserted`);
    if (resume && this.currentSong === null) {
      await this.start();
    }
  }

  public dequeue() {
    if (this.isEmpty()) {
      console.log("No items in queue");
      return null;
    }
    const firstItem = this.items.shift();

    if (this.repeat && firstItem) this.items.push(firstItem);
    return firstItem;
  }

  public peek() {
    if (this.isEmpty()) {
      return;
    }
    return this.items.at(0);
  }

  public shuffle() {
    this.items = this.items.sort(() => 0.5 - Math.random());
  }

  public isEmpty() {
    return this.items.length == 0;
  }

  public printQueue() {
    console.log(this.items.join(", "));
  }

  public getCurrentSong() {
    return this.currentSong;
  }

  public getRepeat() {
    return this.repeat;
  }

  public setRepeat(enabled: boolean) {
    this.repeat = enabled;
    if (this.currentSong?.name) this.items.push(this.currentSong);
  }

  public async setConnection(channel: VoiceBasedChannel) {
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
    this.connection.subscribe(this.audioPlayer);

    this.audioPlayer.addListener("stateChange", async (oldOne, newOne) => {
      if (newOne.status === "idle") {
        this.start();

        this.closeConnectionTimeout = setTimeout(() => {
          this.connection?.destroy();
          this.connection = null;
          this.clearStatusPlayer();
        }, MAX_IDLE_TIME_MS);
      }
    });
  }

  async start(): Promise<void> {
    await this.executeStatusPlayer();

    this.clearPlayTimeout();

    try {
      const firstSong = this.dequeue();
      if (!firstSong || !firstSong.name)
        //Needed to add !firstSong.name -> in case sth went wrong
        return console.error("No current song to play");
      const songPath = path.join(MUSIC_FOLDER, firstSong.name);

      if (!isMp3Available(songPath)) {
        console.log("No file found, skip");
        return await this.start();
      }
      this.clearCloseConnectionTimeout();

      const resource = createAudioResource(songPath);

      if (!this.audioPlayer || !this.connection)
        return console.error("No audio player or connection :(");
      this.audioPlayer.play(resource);

      try {
        const duration = await getMp3Duration(songPath);
        this.currentSong = {
          ...firstSong,
          duration: 0,
          resource
        };
        this.currentSong!.duration = duration * 1000;
        this.updateStatusMessage();
      } catch (err) {
        console.error("Error:", err);
      }
    } catch (error) {
      console.error(error);
      getBotCommandsChannel()?.send("Failed to play the file.");
    }
  }

  public stop() {
    this.clearPlayTimeout();
    this.audioPlayer?.stop();
    this.items = [];
    this.clearStatusPlayer();
  }

  public skip() {
    this.audioPlayer?.stop();

    if (this.isEmpty()) {
      this.clearPlayTimeout();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  private clearCloseConnectionTimeout() {
    if (this.closeConnectionTimeout) {
      clearTimeout(this.closeConnectionTimeout);
      this.closeConnectionTimeout = null;
    }
  }
  private async updateStatusMessage() {
    if (!this.statusData) return;

    await this.statusData.message.edit({
      embeds: [createSongEmbed(this.currentSong)]
    });
  }

  private async executeStatusPlayer() {
    if (this.statusData) return;
    const statusChannel = client.channels.cache.get(
      process.env.BOT_STATUS_CHANNEL_ID
    );
    if (!statusChannel || !statusChannel.isTextBased())
      return console.log("Status channel does not exist");

    const statusMessageInst = await statusChannel.send({
      embeds: [createSongEmbed(this.currentSong)]
    });

    this.statusData = {
      message: statusMessageInst,
      interval: setInterval(() => {
        statusMessageInst.edit({
          embeds: [createSongEmbed(this.currentSong, this.peek())]
        });
      }, PLAYER_STATUS_UPDATE_MS)
    };
  }

  private clearStatusPlayer() {
    if (!this.statusData) return;
    clearInterval(this.statusData.interval);
    this.statusData = null;
  }

  private clearPlayTimeout() {
    this.playTimeout ? clearTimeout(this.playTimeout) : null;
    this.playTimeout = null;
  }
}

export default new PlayerQueue();
