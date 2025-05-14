const express = require("express");
const multer = require("multer");
const path = require("path");
const supabase = require("../supabase");
const fs = require("fs");

// Create a router for handling image upload
const router = express.Router();
const upload = multer({ dest: "tmp/" }); // temp local storage

// Configure Multer to handle file uploads
/*const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store files in 'images' folder
    cb(null, "images/");
  },
  filename: (req, file, cb) => {
    // Generate a unique filename by using the current timestamp and the file extension
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, uniqueSuffix);
  },
});*/

// Define file upload limit and type (optional)
/*const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});*/

// POST endpoint to upload an image
/*router.post("/", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Construct the URL for the uploaded file
  const fileUrl = `${req.protocol}://${req.get("host")}/images/${
    req.file.filename
  }`;

  res.status(200).json({
    message: "File uploaded successfully",
    fileUrl: fileUrl,
  });
});*/
router.post("/", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const fileExt = path.extname(req.file.originalname);
  const fileName = `${Date.now()}${fileExt}`;
  const filePath = req.file.path; // temp local path

  const { data, error } = await supabase.storage
    .from("images") // replace with your actual bucket
    .upload(`${fileName}`, fs.createReadStream(filePath), {
      contentType: req.file.mimetype,
      upsert: true,
    });

  // Clean up local temp file
  fs.unlinkSync(filePath);

  if (error) {
    console.error("Supabase upload error:", error);
    return res.status(500).json({ error: "Upload to Supabase failed" });
  }

  const { data: publicUrlData } = supabase.storage
    .from("images")
    .getPublicUrl(`${fileName}`);
  console.log("Public URL:", publicUrlData);

  res.status(200).json({
    message: "File uploaded to Supabase successfully",
    fileUrl: publicUrlData.publicUrl,
  });
});

// Serve static files from the 'uploads' folder
router.use("/images", express.static("images"));

module.exports = router;
