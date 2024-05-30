require("dotenv").config();
const express = require("express");
const app = express();

const path = require("path");

app.use(express.static("public"));

app.get("/", function (req, res) {
  console.log("eee aha");
  return res.send("Dc bot suno ai home page");
});

app.get("");

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
