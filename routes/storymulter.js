const multer = require("multer");
const path = require("path");
const crypto = require("crypto");


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/story");
  },
  filename: function (req, file, cb) {
    const fn =
      crypto.randomBytes(16).toString("hex") + path.extname(file.originalname);
    cb(null, fn);
  },
});

const storyupload = multer({ storage: storage });
module.exports = storyupload;