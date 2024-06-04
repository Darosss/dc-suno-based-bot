import fs from "fs";
import { CONFIG_PATH } from "@/src/globals";
import { isFileAccesilbe } from "./files.utils";

export type ConfigsType = {
  maxIdleTimeMs: number;
  playerStatusUpdateMs: number;
  maxRadioSongs: number;
  addMultipleSongsMaxCount: number;
};

const defaultConfigs: ConfigsType = {
  maxIdleTimeMs: 25000,
  playerStatusUpdateMs: 10000,
  maxRadioSongs: 10,
  addMultipleSongsMaxCount: 10
};

class ConfigsHandler {
  private configs: ConfigsType = defaultConfigs;
  constructor() {
    this.initConfigFile();
    this.loadConfigs();
  }
  public async editConfigsFile(data: Partial<ConfigsType>): Promise<boolean> {
    try {
      const newConfigs = { ...this.getConfigsFile(), ...data };
      await fs.promises.writeFile(CONFIG_PATH, JSON.stringify(newConfigs));

      this.loadConfigs();
      return true;
    } catch (err) {
      console.error("Something went wrong while editing configs");
      return false;
    }
  }

  public resetToDefaults() {
    this.editConfigsFile(defaultConfigs);
  }

  public getConfigs() {
    return this.configs;
  }
  private async initConfigFile() {
    const configAccessible = await isFileAccesilbe(CONFIG_PATH);

    if (configAccessible) {
      return console.log("Config already exist. Skip");
    }
    console.log(`Init configs file -> ${CONFIG_PATH}`);

    await fs.promises.writeFile(CONFIG_PATH, JSON.stringify(defaultConfigs));
  }

  private getConfigsFile(): ConfigsType {
    try {
      const configs = fs.readFileSync(CONFIG_PATH, { encoding: "utf-8" });

      const configsParsed = JSON.parse(configs) as ConfigsType;

      return configsParsed;
    } catch (err) {
      console.error("Something went wrong with getting configs");
      return defaultConfigs;
    }
  }

  private loadConfigs() {
    this.configs = this.getConfigsFile();
  }
}

export default new ConfigsHandler();
