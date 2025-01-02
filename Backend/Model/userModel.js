const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  streamId :{
    type: String,
    required: true,
  },
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