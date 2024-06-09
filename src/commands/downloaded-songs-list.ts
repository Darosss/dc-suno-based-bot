import { AttachmentBuilder, SlashCommandBuilder } from "discord.js";
import { getMp3FromMusicFolder, saveMp3ListToFile } from "@/utils/mp3.utils";
import { COMMANDS } from "./commands-list";
import { isDcMessage } from "@/utils/dc.utils";
import { MessageCommandType } from "@/src/types";

const COMMAND_DATA = COMMANDS.songs;

const downloadedSongsListCommand = async (message: MessageCommandType) => {
  const mp3AttachmentTxt = await sendPossibleFilesAsPrivMessage();

  if (!mp3AttachmentTxt)
    return await message.reply("No songs at all. Add some");
  if (!isDcMessage(message)) {
    await message.user.send({ files: [mp3AttachmentTxt] });
  } else {
    await message.author.send({ files: [mp3AttachmentTxt] });
  }

  return await message.reply("Check priv message from me");
};

const sendPossibleFilesAsPrivMessage = async () => {
  const files = await getMp3FromMusicFolder();
  if (files.length <= 0) return;
  const mp3NamesTxt = await saveMp3ListToFile(files);
  const attachment = new AttachmentBuilder(mp3NamesTxt);

  return attachment;
};

const data = new SlashCommandBuilder()
  .setName(COMMAND_DATA.name)
  .setDescription(COMMAND_DATA.description);

export {
  data,
  downloadedSongsListCommand as execute,
  COMMAND_DATA as command,
  downloadedSongsListCommand as executeAsText
};
