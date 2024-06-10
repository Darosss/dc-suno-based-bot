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
import { DiscordAPIError, Message, VoiceBasedChannel } from "discord.js";
import { CurrentSongType, PlayerQueueItemType } from "./types";
import { client } from "./init-bot";
import { createSongEmbed, getBotCommandsChannel } from "@/src/utils/dc.utils";
import { isFileAccesilbe } from "@/src/utils/files.utils";
import ConfigsHandler from "@/src/utils/configs.utils";

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
    console.log(`Item ${item.songData.fileName} by ${item.requester} inserted`);
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
    if (this.currentSong?.songData.name) this.items.push(this.currentSong);
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
        }, ConfigsHandler.getConfigs().maxIdleTimeMs);
      }
    });
  }

  async start(): Promise<void> {
    this.clearPlayTimeout();

    try {
      const firstSong = this.dequeue();
      if (!firstSong || !firstSong.songData.name)
        //Needed to add !firstSong.name -> in case sth went wrong
        return console.error("No current song to play");
      const songPath = path.join(MUSIC_FOLDER, firstSong.songData.fileName);

      if (!isFileAccesilbe(songPath)) {
        console.log("No file found, skip");
        return await this.start();
      }
      this.clearCloseConnectionTimeout();

      const resource = createAudioResource(songPath);

      if (!this.audioPlayer || !this.connection)
        return console.error("No audio player or connection :(");
      this.audioPlayer.play(resource);

      try {
        this.currentSong = {
          ...firstSong,
          duration: (await getMp3Duration(songPath)) * 1000,
          resource
        };
        await this.executeStatusPlayer();
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
    this.currentSong = null;
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

  private createSongEmbeedHelper() {
    return createSongEmbed(
      this.currentSong,
      this.repeat,
      this.items.slice(0, 4)
    );
  }

  private clearCloseConnectionTimeout() {
    if (this.closeConnectionTimeout) {
      clearTimeout(this.closeConnectionTimeout);
      this.closeConnectionTimeout = null;
    }
  }

  public async refreshStatusPlayerWithNewConfigs() {
    await this.clearStatusPlayer();
    this.executeStatusPlayer();
  }

  private async executeStatusPlayer() {
    if (this.statusData || !this.currentSong) return;
    const statusChannel = client.channels.cache.get(
      ConfigsHandler.getConfigs().botStatusChannelId
    );
    if (!statusChannel || !statusChannel.isTextBased())
      return console.log("Status channel does not exist");

    const statusMessageInst = await statusChannel.send({
      embeds: [this.createSongEmbeedHelper()]
    });

    const statusDataInterval = setInterval(async () => {
      try {
        await statusMessageInst.edit({
          embeds: [this.createSongEmbeedHelper()]
        });
      } catch (err: unknown) {
        if (err instanceof DiscordAPIError) {
          console.log("Probably someone deleted status message ->", {
            code: err.code,
            message: err.message
          });
          this.clearStatusPlayer();
          this.executeStatusPlayer();
        } else {
          console.log(err);
          throw err;
        }
      }
    }, ConfigsHandler.getConfigs().playerStatusUpdateMs);

    this.statusData = {
      message: statusMessageInst,
      interval: statusDataInterval
    };
  }

  private async clearStatusPlayer() {
    if (!this.statusData) return;
    clearInterval(this.statusData.interval);
    this.statusData.message.deletable
      ? await this.statusData.message.delete()
      : null;
    this.statusData = null;
  }

  private clearPlayTimeout() {
    this.playTimeout ? clearTimeout(this.playTimeout) : null;
    this.playTimeout = null;
  }
}

export default new PlayerQueue();
