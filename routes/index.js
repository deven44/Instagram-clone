var express = require('express');
var router = express.Router();
const passport = require('passport');
const localStrategy = require('passport-local');
const userModel = require('./users');
const postModel = require('./posts');
const commentModel = require('./comments.js');
passport.use(new localStrategy(userModel.authenticate()));
const upload = require("./multer");
const utils = require('../utils/utils');

// GET
router.get('/', function(req, res) {
  res.render('index', {footer: false});
});

router.get('/login', function(req, res) {
  res.render('login', {footer: false});
});

router.get('/like/:postid', async function(req, res) {
  const post = await postModel.findOne({_id: req.params.postid});
  const user = await userModel.findOne({username: req.session.passport.user});
  if(post.like.indexOf(user._id) === -1){
      post.like.push(user._id)
    
   }else{
     post.like.splice(post.like.indexOf(user._id),1)
   
   }
   await post.save()

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
  const post = await postModel.findOne({_id:req.params.postid}).populate('comments')
  const commentindb = await commentModel.create({
    
    username:loguser.username,
    profile:loguser.picture,
    comment:comment,
    postid:post._id,
  })
  console.log(comment)

 
   
   await post.comments.push(commentindb._id)
   await post.save();

   
   res.json(commentindb);
  
});



router.get('/feed', isLoggedIn, async function(req, res) {
  let user = await userModel
  .findOne({username: req.session.passport.user})
  .populate("posts");

 let posts = await postModel.find().populate("user")


  res.render('feed', {footer: true, user,posts});
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

  if(followhonewala.followers.indexOf(followkarnewala._id)=== -1){
    followhonewala.followers.push(followkarnewala._id)
    followkarnewala.following.push(followhonewala._id)
  }else{
    followhonewala.followers.splice(followhonewala.followers.indexOf(followkarnewala._id),1)
    followkarnewala.following.splice(followhonewala.following.indexOf(followhonewala._id),1)
  }
  await followkarnewala.save()
  await followhonewala.save()
 res.redirect("back")
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
  const post = await postModel.create({
    user: user._id,
    caption: req.body.caption,
    picture: req.file.filename,
  })
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});

router.post('/upload', isLoggedIn, upload.single('image'), async function(req, res) {
  const user = await userModel.findOne({username: req.session.passport.user});
  user.picture = req.file.filename;
  await user.save();
  res.redirect('/edit');
});

// POST

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
