const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// File path to store logs
const logFilePath = path.join(__dirname, "ip-log.txt");

// Endpoint to log IP address
router.post("/", async (req, res) => {
  try {
    const ip = req.ip; // Get the client's IP address

    // Log the IP address to a file
    fs.appendFile(logFilePath, `IP: ${ip} - Timestamp: ${new Date().toISOString()}\n`, (err) => {
      if (err) {
        console.error("Failed to log IP:", err);
        return res.status(500).json({ message: "Failed to log IP" });
      }
      res.status(200).json({ message: "IP logged successfully" });
    });
  } catch (error) {
    console.error("Failed to log IP:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
