# Simple discord bot for streaming suno ai music

A simple and powerful Discord music bot that supports both Suno and YouTube playback.

_Use at own risk. It's just made for fun_

## Built with

- discord.js
- cheerio
- ffmpeg-static
- yt-search

# Configure Before install

```
BOT_TOKEN =
APP_ID =

#_BOT_TOKEN, APP_ID - can be obtained from discord developers
https://discord.com/developers/applications_

COMMANDS_PREFIX =
OWNER_ID =
SERVER_PORT =
BOT_COMMANDS_CHANNEL_ID =
BOT_STATUS_CHANNEL_ID =

# set this to 80/90% of maximum storage. Fe. if you know that hosting have max 1GB cappacity, set it to 900MB, just in case
MUSIC_FOLDER_MAX_MB=

#Optional if needed
FFPROBE_PATH=

#Optional (default by api) In case where API calls wont work - use cheerio?
FORCE_CHEERIO_UPDATE_SONGS=true / false
```

_This can be found in the the .env.example file too._

# Example Install

`npm install`

`npm start`
