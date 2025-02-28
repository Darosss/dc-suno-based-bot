import { AttachmentBuilder, SlashCommandBuilder } from "discord.js";
import {
  ALL_POSSIBLE_AUDIOS_PATH,
  getAllPossibleAudios
} from "@/utils/mp3.utils";
import { COMMANDS } from "./commands-list";
import { isDcMessage } from "@/utils/dc.utils";
import { MessageCommandType } from "@/src/types";

const COMMAND_DATA = COMMANDS["all songs"];

const allSongsListCommand = async (message: MessageCommandType) => {
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
  const possibleAudios = await getAllPossibleAudios();
  if (possibleAudios.length <= 0) return;

  const attachment = new AttachmentBuilder(ALL_POSSIBLE_AUDIOS_PATH);
  return attachment;
};

const data = new SlashCommandBuilder()
  .setName(COMMAND_DATA.name.replaceAll(" ", "-"))
  .setDescription(COMMAND_DATA.description);

export {
  data,
  allSongsListCommand as execute,
  COMMAND_DATA as command,
  allSongsListCommand as executeAsText
};
