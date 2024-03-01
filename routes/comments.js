const mongoose = require('mongoose')


const commentSchema = mongoose.Schema({
    username: String,
    profile:String,
   comment:String,
   postid:String,

})

module.exports = mongoose.model("comment",commentSchema)