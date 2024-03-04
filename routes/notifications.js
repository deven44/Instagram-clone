const mongoose = require('mongoose')


const notificationSchema = mongoose.Schema({
   receiver:String,
   sender:String,
   senderprofile : String,
   notification:String,
   comment:String,
   like:String,
   postimg:String,
})

module.exports = mongoose.model("notification", notificationSchema);