const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const streamRoutes = require("./Apis/Streams.js");
const express = require("express");

const app = express();
app.use(bodyParser.json());
app.use(cors());
dotenv.config();

const URL =
  "mongodb+srv://harshil:harshil8888@cluster0.nguunro.mongodb.net/Stream?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(URL)
  .then(() => {
    console.log("db connected");
    app.listen(3001);
  })
  .catch((error) => console.log(error));

  app.use("/api", streamRoutes);