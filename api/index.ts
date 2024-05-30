require("dotenv").config();
const express = require("express");
const app = express();
const { sql } = require("@vercel/postgres");

const bodyParser = require("body-parser");
const path = require("path");
const urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(express.static("public"));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "..", "components", "home.htm"));
});

app.get("");

app.listen(process.env.SERVER_PORT, () => {
  console.log(`Server ready on port ${process.env.SERVER_PORT}.`);
  require("./init-bot");
});

module.exports = app;
