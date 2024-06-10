// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();
import "module-alias/register";

import EnvChecker from "./utils/env-checker.utils";

new EnvChecker().init();

import "./utils/configs.utils";

import express from "express";
const app = express();

app.use(express.static("public"));

app.get("/", function (req, res) {
  return res.send("Dc bot suno ai home page");
});

app.listen(process.env.SERVER_PORT, () => {
  console.log(`Server ready on port ${process.env.SERVER_PORT}.`);
  require("./init-bot");
});

console.log(
  `Invite bot by link
  https://discord.com/oauth2/authorize?client_id=<APPLICATION_ID_HERE>&permissions=8&scope=bot
  You can find it here: https://discord.com/developers/applications
  *NOTE*: Bot needs two enabled options SERVER MEMBERS INTENT and MESSAGE CONTENT INTENT
  boths are in https://discord.com/developers/applications/<APPLICATION_ID_HERE>/bot

  `
);

module.exports = app;
