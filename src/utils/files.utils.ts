import fs from "fs";

export const isFileAccesilbe = async (
  absolutePath: string
): Promise<boolean> => {
  try {
    await fs.promises.access(absolutePath, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
};
