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
      default: () => new Date(+new Date() + 24 * 60 * 60 * 1000), // 24 hours in milliseconds
    },
})

module.exports = mongoose.model("story",storySchema);