const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  senderAddress: {
    type: String,
    required: true,
  },
  reciverAddress: {
    type: String,
    required: true,
  },
  fee: {
    type: String,
    required: true,
  },
  currentTime: {
    type: String,
    required: true,
  },
  flowRate: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("StreamUsers", userSchema);