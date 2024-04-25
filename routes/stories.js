const mongoose = require('mongoose')


const storySchema = mongoose.Schema({
   user:{ type: mongoose.Schema.Types.ObjectId, ref: 'user'},
   picture:String,
   timestamp: {
      type: Date,
      default: Date.now,
    },
    expirationTime: {
      type: Date,
      default: function() {
          // Calculate expiration time 24 hours after timestamp
          return new Date(this.timestamp.getTime() + 24 * 60 * 60 * 1000);
      }
  },
})

module.exports = mongoose.model("story",storySchema);