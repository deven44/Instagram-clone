const mongoose = require('mongoose')
mongoose.connect("mongodb://127.0.0.1:27017/instadb");

const postSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user'},
    picture:{
        type:String
    },
    caption: { type: String, default: '',required:true },
    


})

module.exports = mongoose.model("post",postSchema)