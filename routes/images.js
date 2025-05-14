const express = require("express");
const multer = require("multer");
const path = require("path");

// Create a router for handling image upload
const router = express.Router();

// Configure Multer to handle file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store files in 'images' folder
    cb(null, "images/");
  },
  filename: (req, file, cb) => {
    // Generate a unique filename by using the current timestamp and the file extension
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, uniqueSuffix);
  },
});

// Define file upload limit and type (optional)
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

// POST endpoint to upload an image
router.post("/", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Construct the URL for the uploaded file
  const fileUrl = `${req.protocol}://${req.get("host")}/images/${req.file.filename}`;


  res.status(200).json({
    message: "File uploaded successfully",
    fileUrl: fileUrl,
  });
});

// Serve static files from the 'uploads' folder
router.use("/images", express.static("images"));

module.exports = router;
