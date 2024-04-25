var express = require('express');
var router = express.Router();
const passport = require('passport');
const localStrategy = require('passport-local');
const userModel = require('./users');
const postModel = require('./posts');
const notificationModel = require('./notifications.js');
const storyModel = require('./stories.js');
const commentModel = require('./comments.js');
const messageModel = require('./message.js');
passport.use(new localStrategy(userModel.authenticate()));
const upload = require("./multer");
const storyupload = require("./storymulter.js");
const utils = require('../utils/utils');
const fs = require('fs')
const axios = require('axios')
const bcrypt = require('bcrypt');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();
cloudinary.config({ 
  cloud_name: 'dsnakijs3', 
  api_key: '766361988113194', 
  api_secret: 'U9vr2n7J5M8WwuKKlngjnkK_CIM'
});

// GET
router.get('/', function(req, res) {
  res.render('index', {footer: false});
});

router.get('/login', function(req, res) {
  res.render('login', {footer: false});
});

router.get('/like/:postid', isLoggedIn, async function(req, res) {
  const post = await postModel.findOne({_id: req.params.postid}).populate('user');
  const user = await userModel.findOne({username: req.session.passport.user});
  //notifications logic:
  await notificationModel.create({
    sender: user.username,
    receiver:post.user.username,
    senderprofile:user.picture,
    like:"Liked your post.",
    postimg:post.picture
    })
   let notification = await notificationModel.findOne({
    sender: user.username,
     receiver:post.user.username,
     senderprofile:user.picture,
      like:"Liked your post.",
      postimg:post.picture,
     })
  const postuser = await userModel.findOne({_id:post.user._id})
    
    if(post.like.indexOf(user._id) === -1){
      post.like.push(user._id)

    
 

    await postuser.notifications.push(notification._id);
    
    //
    
  }else{
    post.like.splice(post.like.indexOf(user._id),1)
    
   postuser.notifications.splice(postuser.notifications.indexOf(notification._id),1);
    
  }
  await post.save()
  await user.save();
  await postuser.save()
  
    res.json(post);

});
router.get('/save/:postid', async function(req, res) {
  var user = await userModel.findOne({username:req.session.passport.user})
  if(user.saved.indexOf(req.params.postid) === -1){
    user.saved.push(req.params.postid)
  }
  else{
    var index = user.saved.indexOf(req.params.postid)
    user.saved.splice(index,1)
  }
  await user.save()
  res.json(user)

});


router.get('/comment/:postid', isLoggedIn, async function(req, res) {
  let user = await userModel.findOne({username: req.session.passport.user})
   const post = await postModel.findOne({_id:req.params.postid}).populate('comments').populate('user')
   console.log(post)
  res.render("comment", {footer: true,post,user})
});

router.post('/comment/:postid', isLoggedIn, async function(req, res) {
  const comment = req.body.comment; 
  let loguser = await userModel.findOne({username: req.session.passport.user})
  const post = await postModel.findOne({_id:req.params.postid}).populate('comments','user')
  const commentindb = await commentModel.create({
    username:loguser.username,
    profile:loguser.picture,
    comment:comment,
    postid:post._id,
  })
 
  await post.comments.push(commentindb._id)
  await post.save();

//notification logic
  await notificationModel.create({
    sender: loguser.username,
    receiver:post.user.username,
    senderprofile:loguser.picture,
    comment:comment,
    postimg:post.picture
    })
  const notification = await notificationModel.findOne({
    sender: loguser.username,
     receiver:post.user.username,
     senderprofile:loguser.picture,
     comment:comment,
     postimg:post.picture
     })
  const postuser = await userModel.findOne({_id:post.user._id})
  console.log(postuser)
  

  await postuser.notifications.push(notification._id);
   await  postuser.save();
   
   res.json(commentindb);
  
});



router.get('/feed', isLoggedIn, async function(req, res) {
  let user = await userModel
  .findOne({username: req.session.passport.user})
  .populate("posts");

let  allusers = await userModel.find().populate("stories");
 let posts = await postModel.find().populate("user")

 
 let allstories = await storyModel.find().populate("user") 
 let stories = [];
 allstories.forEach(async (story)=>{
  const particularDate = new Date(story.timestamp);
  const currentDate = new Date();
  const timeDifferenceMs = currentDate - particularDate;
  const hoursPassed = timeDifferenceMs / (1000 * 60 * 60);
   console.log(hoursPassed)
  if(hoursPassed<24){
    stories.push(story);  
  }else{
    await storyModel.findOneAndDelete({_id:story._id})
    const storyuser=  await userModel.findOne({username:story.user.username})
    let index = storyuser.stories.indexOf(story._id)
    storyuser.stories.splice(index,1)
  }
 })
console.log(stories.user)
  res.render('feed', {footer: true, user,posts,stories ,allusers,  dater: utils.formatRelativeTime,});
});

router.get('/profile', isLoggedIn, async function(req, res) {
  let user = await userModel
  .findOne({username: req.session.passport.user})
  .populate("posts");

  res.render('profile', {footer: true, user});
});

router.get('/search', isLoggedIn, async function(req, res) {
  let user = await userModel.findOne({username: req.session.passport.user})
  res.render('search', {footer: true,user});
});

router.get('/search/:username', isLoggedIn, async function(req, res) {
  const regex = new RegExp(`^${req.params.username}`, 'i');
 var users = await userModel.find({username:regex})
 res.json(users);
 
});

router.get('/searcheduser/:username', isLoggedIn, async function(req, res) {
  let user = await userModel.findOne({username: req.session.passport.user}).populate("posts")
  let searcheduser = await userModel.findOne({username: req.params.username}).populate("posts")
  if(user.username ==req.params.username){
    res.render('profile', {footer: true, user,searcheduser });
  }else{

    res.render('searcheduser.ejs', {footer: true, searcheduser,user});
  }
});
router.get('/follow/:username', isLoggedIn, async function(req, res) {
  let followkarnewala = await userModel.findOne({username: req.session.passport.user}).populate("posts")
  let followhonewala = await userModel.findOne({username: req.params.username}).populate("posts")

  //follow notification logic
  await notificationModel.create({
    sender:followkarnewala.username,
    receiver:followhonewala.username,
    senderprofile:followkarnewala.picture,
    notification:"Started following you."
   })

  const notification = await notificationModel.findOne({
    sender:followkarnewala.username,
    receiver:followhonewala.username,
    senderprofile:followkarnewala.picture,
    notification:"Started following you."
  })

  if(followhonewala.followers.indexOf(followkarnewala._id)=== -1){
    followhonewala.followers.push(followkarnewala._id)
    followkarnewala.following.push(followhonewala._id)

   
    await followhonewala.notifications.push(notification._id);


  }else{
    followhonewala.followers.splice(followhonewala.followers.indexOf(followkarnewala._id),1)
    followkarnewala.following.splice(followhonewala.following.indexOf(followhonewala._id),1)
    //follow notification logic
    followhonewala.notifications.splice(followhonewala.notifications.indexOf(notification._id),1);

  }
  await followkarnewala.save()
  await followhonewala.save()
 res.redirect("back")
});

router.get('/notifications/:userid', isLoggedIn, async function(req, res) {
  let user = await userModel.findOne({username: req.session.passport.user}).populate('notifications')
  res.render('notifications',{footer: true, user})
 
});


router.get('/edit', isLoggedIn, async function(req, res) {
  
  const user = await userModel.findOne({username: req.session.passport.user});
  res.render('edit', {footer: true, user});
});

router.get('/upload', isLoggedIn, async function(req, res) {
  let user = await userModel
  .findOne({username: req.session.passport.user})
  res.render('upload', {footer: true, user});
});

router.post('/update', isLoggedIn, async function(req, res) {
  const user = await userModel.findOneAndUpdate({username: req.session.passport.user}, {username: req.body.username, name: req.body.name, bio: req.body.bio}, {new: true});
  req.login(user, function(err){
    if(err) throw err;
    res.redirect("/profile");
  });
});




router.post('/post', isLoggedIn, upload.single("image"), async function(req, res) {
  const user = await userModel.findOne({username: req.session.passport.user});
  cloudinary.uploader.upload(req.file.path,async (err,result)=>{
   
    const post = await postModel.create({
      user: user._id,
      caption: req.body.caption,
      picture: result.secure_url,
    })
    user.posts.push(post._id);
    await user.save();
    
  })

  
  res.redirect("/profile");
});

router.post('/upload', isLoggedIn, upload.single('image'), async function(req, res) {
  const user = await userModel.findOne({username: req.session.passport.user});
  cloudinary.uploader.upload(req.file.path,async (err,result)=>{
    user.picture =result.secure_url;
    await user.save();
  })
  res.redirect('/edit');
});

router.post('/uploadstory', isLoggedIn, storyupload.single('story'), async function(req, res) {
  const user = await userModel.findOne({username: req.session.passport.user});
  cloudinary.uploader.upload(req.file.path,async (err,result)=>{

    const story = await storyModel.create({
      user: user._id,
      picture: result.secure_url,
    });
    await user.stories.push(story._id)
    await user.save();
  })
  res.redirect('feed');

});

router.get('/story/:storyuserid', isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({username: req.session.passport.user});
  const storyuser = await userModel.findOne({_id: req.params.storyuserid});
   const stories = await storyModel.find({user:req.params.storyuserid})
   console.log(stories)
 
  
 return res.render('story',{footer:true,user,storyuser,stories, dater: utils.formatRelativeTime,});

});

// POST
router.get('/messageList',isLoggedIn , async function(req, res) {
  const user = await userModel.findOne({username:req.session.passport.user}).populate('following').populate('followers')

const combinedArray = user.following.concat(user.followers);

const objectMap = new Map();

// Iterate through the array of objects
combinedArray.forEach(obj => {
    // If the ID is not in the map, add the object to the map
    if (!objectMap.has(obj._id.toString())) {
        objectMap.set(obj._id.toString(), obj);
    }
});

// Convert the map values back to an array
const messageUserArray = Array.from(objectMap.values());

  res.render('messageUsers.ejs',{footer:true,user,messageUserArray});
});

router.get('/message/:oppositeUserId',isLoggedIn , async function(req, res) {

  const user = await userModel.findOne({username:req.session.passport.user}).populate('following').populate('followers')
  const oppositeUser = await userModel.findOne({_id:req.params.oppositeUserId})

  res.render('chat.ejs',{footer:false,user,oppositeUser});
});

router.get('/getMessage/:oppositeUserId',isLoggedIn, async function(req,res,next){
  const user = await userModel.findOne({username:req.session.passport.user}).populate('following').populate('followers')
  const oppositeUser = await userModel.findOne({username:req.params.oppositeUserId})

  const messages = await messageModel.find({
    $or:[
      {
        sender:user.username,
        receiver:oppositeUser.username
      },
      {
        receiver:user.username,
        sender:oppositeUser.username
      },
    ]
  })

  res.json(messages)

})

router.post('/register', function(req, res) {
  const user = new userModel({
    username: req.body.username,
    email: req.body.email,
    name: req.body.name
  })

  userModel.register(user, req.body.password)
  .then(function(registereduser){
    passport.authenticate("local")(req, res, function(){
      res.redirect("/profile");
    })
  })
});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/feed",
  failureRedirect: "/login"
}), function(req, res){});

router.get("/logout", function(req, res){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
})

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  else{
    res.redirect("/login");
  }
}

module.exports = router;
