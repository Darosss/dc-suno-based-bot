declare module "mp3-duration" {
  /**
   * Gets the duration of an MP3 file.
   * @param path The path to the MP3 file.
   * @param callback The callback function to execute with the duration or an error.
   */
  function mp3Duration(
    path: string,
    callback: (error: Error | null, duration: number) => void
  ): void;

  export = mp3Duration;
}
