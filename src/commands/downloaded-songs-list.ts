import { AttachmentBuilder, Message } from "discord.js";
import { getMp3FromMusicFolder, saveMp3ListToFile } from "@/utils/mp3.utils";

export const downloadedSongsListCommand = async (message: Message) => {
  await sendPossibleFilesAsPrivMessage(message);
};

const sendPossibleFilesAsPrivMessage = async (message: Message) => {
  const files = getMp3FromMusicFolder();
  saveMp3ListToFile(files).then(async (mp3NamesTxt) => {
    const attachment = new AttachmentBuilder(mp3NamesTxt);
    await message.author.send({ files: [attachment] });
  });
};
