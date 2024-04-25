const mongoose = require('mongoose');
const plm = require("passport-local-mongoose");

mongoose.connect("mongodb+srv://devenmewada660:JRscLvA99gPJrbIw@instacluster.wl7k1gz.mongodb.net/?retryWrites=true&w=majority&appName=instacluster");

const userSchema = mongoose.Schema({
  username: String,
  name: String,
  email: String,
  password: String,
  picture: {
    type: String,
    default: "def.png"
  },
  contact: String,
  bio: String,
  stories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "story" 
    }
  ],
  saved: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post" 
    }
  ],
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "post" 
  }],
  followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "user" 
    } ],
  following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "user" 
    }],
    notifications:[{
      type: mongoose.Schema.Types.ObjectId,
      ref: "notification" 
    }],
    socketId: { type: String }
})

userSchema.plugin(plm);

module.exports = mongoose.model("user", userSchema);